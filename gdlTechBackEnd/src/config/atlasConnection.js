const mongoose = require('mongoose');

const atlasURI = process.env.MONGODB_URI;

const atlasConnection = mongoose.createConnection(atlasURI, {
    serverSelectionTimeoutMS: 5000
});

atlasConnection.on('connected', () => {
    console.log(`🌍 Atlas conectado ✔️`);
});

atlasConnection.on('error', (err) => {
    console.error(`❌ Error en Atlas:`, err.message);
});

module.exports = atlasConnection;
