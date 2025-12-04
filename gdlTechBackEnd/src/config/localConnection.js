const mongoose = require('mongoose');

const localURI = process.env.MONGO_LOCAL;

// Solo crear conexión si MONGO_LOCAL está definido
let localConnection;
if (localURI && localURI.trim() !== '') {
    localConnection = mongoose.createConnection(localURI, {
        serverSelectionTimeoutMS: 10000, // 10 segundos
        socketTimeoutMS: 45000
    });

    localConnection.on('connected', () => {
        console.log(`💾 Mongo Local conectado ✔️`);
    });

    localConnection.on('error', (err) => {
        console.error(`❌ Error en Local:`, err.message);
    });
} else {
    // Crear una conexión dummy que siempre retorna "no conectado"
    localConnection = {
        readyState: 0,
        on: () => {},
        once: () => {}
    };
    console.warn(`⚠️ MONGO_LOCAL no definido, conexión local deshabilitada`);
}

module.exports = localConnection;
