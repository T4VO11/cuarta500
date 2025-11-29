const mongoose = require('mongoose');

const localURI = process.env.MONGO_LOCAL;

const localConnection = mongoose.createConnection(localURI);

localConnection.on('connected', () => {
    console.log(`💾 Mongo Local conectado ✔️`);
});

localConnection.on('error', (err) => {
    console.error(`❌ Error en Local:`, err.message);
});

module.exports = localConnection;
