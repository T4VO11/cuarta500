const mongoose = require('mongoose');

const atlasURI = process.env.MONGODB_URI;

// Solo crear conexión si MONGODB_URI está definido
let atlasConnection;
if (atlasURI && atlasURI.trim() !== '') {
    atlasConnection = mongoose.createConnection(atlasURI, {
        serverSelectionTimeoutMS: 15000, // Aumentado a 15 segundos
        socketTimeoutMS: 45000
    });

    atlasConnection.on('connected', () => {
        console.log(`🌍 Atlas conectado ✔️`);
    });

    atlasConnection.on('error', (err) => {
        console.error(`❌ Error en Atlas:`, err.message);
    });
} else {
    // Crear una conexión dummy que siempre retorna "no conectado"
    atlasConnection = {
        readyState: 0,
        on: () => {},
        once: () => {}
    };
    console.warn(`⚠️ MONGODB_URI no definido, conexión Atlas deshabilitada`);
}

module.exports = atlasConnection;
