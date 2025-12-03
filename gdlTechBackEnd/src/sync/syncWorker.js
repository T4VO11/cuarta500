// src/sync/syncWorker.js
const PendingOperation = require('../models/sync/PendingOperation');
const atlasConn = require('../config/atlasConnection');

const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL_MS || '30000', 10);
const MAX_MODEL_ERRORS = 5; // Si un modelo no existe despues de 5 intentos, se rompe el ciclo del if (!Model)

//Verificamos que la conexion con Atlas este lista para operar
async function ensureAtlasReady() {
  if (atlasConn.readyState === 1) return true;

  try {
     // Forzar a Mongoose a abrir la conexión si estaba cerrada/suspendida
     await atlasConn.openUri(process.env.MONGODB_URI); 
    //  // O simplemente invocar una operación ligera:
    //  await atlasConn.db.admin().ping();
     return true;
  } catch (e) {
     return false;
  }

  // if (typeof atlasConn.asPromise === 'function') {
  //   try {
  //     await atlasConn.asPromise();
  //     return true;
  //   } catch {
  //     return false;
  //   }
  // }

  // // fallback: intentar ping al admin DB
  // try {
  //   await atlasConn.db.admin().ping();
  //   return true;
  // } catch {
  //   return false;
  // }
}

//Procesamos todas las operaciones pendientes guardadas en local.
async function processPendingOperations() {
  const atlasAvailable = await ensureAtlasReady();

  if (!atlasAvailable) {
    console.log('⚠️ Atlas no disponible, reintentando luego...');
    return;
  }

  const ops = await PendingOperation.find().sort({ createdAt: 1 }).limit(200); // limite por ciclo
  
  if (!ops.length) return;

  for (const op of ops) {
    try {
      // 1.Nos aseguramos que el modelo exista en Atlas
      const atlasModels = atlasConn.modelNames();
      const ModelExists = atlasModels.includes(op.model);

      if (!ModelExists) {
        console.log(`Modelo inexistente en Atlas: ${op.model}. Intento #${op.errorCount +1}`);

        op.errorCount++;
        op.lastAttempt = new Date();

        if (op.errorCount >= MAX_MODEL_ERRORS) {
          console.warn(`Operacion descartada permanentemente (modelo no existente): ${op.model}`);
          await op.deleteOne();
        } else {
          await op.save();
        }

        continue;
      }

      const Model = atlasConn.model(op.model);

      // 2. Ejecutamos segun el tipo de operacion
      if (op.operation === 'create') {
        console.log(`Intentando crear en Atlas: ${op.model}, ID: ${op.payload._id}`);
        await Model.findOneAndUpdate(
          {_id: op.payload._id},
          op.payload,
          {upsert: true, new: true}
        );
      }
      else if (op.operation === 'update') {
        await Model.findByIdAndUpdate(
          op.documentId, 
          op.payload, 
          { new: true, upsert: false }
        );
      } 
      else if (op.operation === 'delete') {
        await Model.findByIdAndDelete(op.documentId);
      }

      console.log(`Sincronizado ${op.operation} -> ${op.model} (${op.documentId})`);

      await op.deleteOne();
    } 

    catch (err) {
      console.error(`❌ Error sincronizando ${op._id}: ${err.message}`);

      //Incrementar contador de errores
      op.errorCount++;
      op.lastAttempt = new Date();
      await op.save();

      // SOLO detener si es un error grave de conexión
      if (err.message.includes('ECONN') || err.message.includes('timed out')) {
        console.error('Error grave de conexión, deteniendo ciclo actual.');
        break;
      }
    }
  }
}

function startSyncWorker() {
  console.log(`🔁 SyncWorker iniciado. Intervalo ${SYNC_INTERVAL}ms`);
  setInterval(() => 
    processPendingOperations().catch(e => console.error('SyncWorker falla:', e)), SYNC_INTERVAL);
}

module.exports = startSyncWorker;
