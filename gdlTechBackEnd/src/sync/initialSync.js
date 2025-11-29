// src/sync/initialSync.js
const fs = require('fs');
const path = require('path');

const atlasModelsDir = path.join(__dirname, '..', 'models', 'atlas');
const localModelsDir = path.join(__dirname, '..', 'models', 'local');

async function initialSync() {
  console.log('🔄 initialSync: comenzando sincronización Atlas → Local (upsert por _id)');

  const files = fs.readdirSync(atlasModelsDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      // require el modelo atlas y el local correspondiente
      const atlasModelPath = path.join(atlasModelsDir, file);
      const localModelPath = path.join(localModelsDir, file);

      // si el local model no existe lo saltamos
      if (!fs.existsSync(localModelPath)) {
        console.warn(`⚠️ Modelo local no encontrado para ${file} — saltando inicialSync para este modelo`);
        continue;
      }

      const atlasModel = require(atlasModelPath);
      const localModel = require(localModelPath);

      // obtener docs de atlas
      const atlasDocs = await atlasModel.find().lean();

      if (!atlasDocs.length) {
        console.log(`ℹ️ Atlas no tiene documentos para ${atlasModel.modelName}`);
        continue;
      }

      // upsert por _id (preservando _id de Atlas)
      const bulkOps = atlasDocs.map(doc => {
        const docCopy = { ...doc };
        // eliminar campos que no deben upsertarse si los hubiera (por ejemplo __v si existe)
        delete docCopy.__v;
        return {
          updateOne: {
            filter: { _id: docCopy._id },
            update: { $set: docCopy },
            upsert: true
          }
        };
      });

      // Ejecutar bulkWrite en local para velocidad
      if (bulkOps.length) {
        const result = await localModel.bulkWrite(bulkOps, { ordered: false });
        console.log(`✅ initialSync: ${file} -> upserted/modified:`, {
          upserted: result.upsertedCount || 0,
          modified: result.modifiedCount || 0
        });
      }
    } catch (err) {
      console.error(`❌ initialSync error en ${file}:`, err.message);
    }
  }

  console.log('🔄 initialSync: terminado');
}

module.exports = initialSync;
