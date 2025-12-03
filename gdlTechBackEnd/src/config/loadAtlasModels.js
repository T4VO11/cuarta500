// src/config/loadAtlasModels.js
const atlasConn = require('./atlasConnection');
const fs = require('fs');
const path = require('path');

// Asumimos que todos tus modelos están en '../models'
const modelsDir = path.join(__dirname, '..', 'models');

module.exports = function loadAtlasModels() {
    // Lee todos los archivos de modelo en el directorio
    fs.readdirSync(modelsDir)
        .filter(file => file.endsWith('.js'))
        .forEach(file => {
            // Requiere el archivo para que se ejecute la definición del Schema
            // y se registre el modelo en la instancia de atlasConn
            require(path.join(modelsDir, file)); 
        });
    console.log('✓ Modelos de Atlas cargados.');
};