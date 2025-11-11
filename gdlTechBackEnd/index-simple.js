// Versión simplificada para probar
require('dotenv').config();
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS simple
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Ruta de prueba simple
app.get('/', (req, res) => {
    res.json({ 
        estado: 'exito',
        mensaje: 'Servidor funcionando',
        data: { test: true }
    });
});

// Ruta de prueba POST
app.post('/test', (req, res) => {
    res.json({ 
        estado: 'exito',
        mensaje: 'POST funcionando',
        data: req.body
    });
});

// Cargar rutas de usuarios
try {
    const rutasUsuarios = require('./src/routes/usuarios');
    app.use('/usuarios', rutasUsuarios);
    console.log('✓ Ruta /usuarios registrada');
} catch (error) {
    console.error('Error al cargar rutas de usuarios:', error);
}

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        estado: 'error',
        mensaje: `Ruta no encontrada: ${req.method} ${req.path}`,
        data: null
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        estado: 'error',
        mensaje: err.message || 'Error interno',
        data: null
    });
});

app.listen(port, () => {
    console.log(`\n✅ Servidor simple corriendo en puerto ${port}`);
    console.log(`✅ Prueba: http://localhost:${port}/`);
    console.log(`✅ POST test: http://localhost:${port}/test`);
    console.log(`✅ POST registrar: http://localhost:${port}/usuarios/registrar\n`);
});

