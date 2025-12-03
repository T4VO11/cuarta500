require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const loadAtlasModels = require('./src/config/loadAtlasModels');

//Imports de configuracion
const connectDB = require('./src/config/mongoose'); 
// Importamos las conexiones (atlas/local) para inicializar 
const localConn = require('./src/config/localConnection');
const atlasConn = require('./src/config/atlasConnection');

const initialSync = require('./src/sync/initialSync');      //Instala datos base si es un nuevo dispositivo
const startSyncWorker = require('./src/sync/syncWorker');    // Mantiene la sincronizacion continua

const decryptionRequest = require('./src/middleware/decryptionRequest');

//Conexion a Base de Datos
connectDB()
  .then(() => {
    console.log("🔗 MongoDB conectado (modo online OK).");
  })
  .catch(() => {
    console.warn("⚠️  MongoDB no disponible, el servidor seguirá en modo offline.");
  }).finally(() => {
    loadAtlasModels();
  });
  
//Arranque de sincronizadores
(async () => {
    console.log("Esperando 2s para estabilidad de conexiones")
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Ejecutando initialSync");
    try {
        // Await para que el worker no inicie hasta que termine el initialSync
        await initialSync();
        console.log("initialSync completado");
    } catch (error) {
        console.error('initialSync fallo: ', err);
    }
    console.log("Iniciando syncWorker (sincronizacion continua...");
    startSyncWorker();
})();

//Arrancamos el servidor
const port = process.env.PORT || 3000;
const { setDefaultAutoSelectFamilyAttemptTimeout } = require('net');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads',express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Middleware de logging para debug
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

app.use((req, res, next) => {
    if (req.path.startsWith('/uploads')) {
        return next();  // No aplicar middleware a imágenes
    }
    decryptionRequest(req, res, next);
});

// Rutas
console.log('Cargando rutas...');
try {
    const rutasUsuarios = require('./src/routes/usuarios');
    console.log('✓ Rutas de usuarios cargadas');
    
    const rutasCategorias = require('./src/routes/categorias');
    const rutasAmenidades = require('./src/routes/amenidades');
    const rutasBitacoras = require('./src/routes/bitacoras');
    const rutasIncidentes = require('./src/routes/incidentes');
    const rutasInvitarAmigos = require('./src/routes/invitarAmigos');
    const rutasListadoAdeudos = require('./src/routes/listadoAdeudos');
    const rutasReglamentos = require('./src/routes/reglamentos');
    const rutasReporteFinanzas = require('./src/routes/reporteFinanzas');
    const rutasReservaciones = require('./src/routes/reservaciones');

    // Aplicar rutas
    app.use('/usuarios', rutasUsuarios);
    console.log('✓ Ruta /usuarios registrada');
    app.use('/categorias', rutasCategorias);
    app.use('/amenidades', rutasAmenidades);
    app.use('/bitacoras', rutasBitacoras);
    app.use('/incidentes', rutasIncidentes);
    app.use('/invitarAmigos', rutasInvitarAmigos);
    app.use('/listadoAdeudos', rutasListadoAdeudos);
    app.use('/reglamento', rutasReglamentos);
    app.use('/reporteFinanzas', rutasReporteFinanzas);
    app.use('/reservaciones', rutasReservaciones);
    console.log('✓ Todas las rutas registradas');
} catch (error) {
    console.error(`❌ Error al cargar rutas:`, error);
    process.exit(1);
}

// Ruta raíz
app.get('/', function(req, res) {
    res.json({
        estado: 'exito',
        mensaje: 'Bienvenidos a GDLTech API',
        data: {
            version: '1.0.0',
            endpoints: {
                usuarios: '/usuarios',
                categorias: '/categorias',
                amenidades: '/amenidades',
                bitacoras: '/bitacoras',
                incidentes: '/incidentes',
                invitarAmigos: '/invitarAmigos',
                listadoAdeudos: '/listadoAdeudos',
                reglamento: '/reglamento',
                reporteFinanzas: '/reporteFinanzas',
                reservaciones: '/reservaciones'
            }
        }
    });
});

// Manejo de errores 404 - DEBE IR AL FINAL
app.use((req, res) => {
    res.status(404).json({
        estado: 'error',
        mensaje: `Ruta no encontrada: ${req.method} ${req.path}`,
        data: null
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error en servidor:', err);
    res.status(err.status || 500).json({
        estado: 'error',
        mensaje: err.message || 'Error interno del servidor',
        data: null
    });
});

app.listen(port, () => {
    console.log(`\n Servidor corriendo en puerto ${port}`);
    console.log(` API disponible en http://localhost:${port}`);
    // console.log(`\n📋 Rutas disponibles:`);
    // console.log(`   POST   /usuarios/registrar`);
    // console.log(`   POST   /usuarios/login`);
    // console.log(`   GET    /usuarios`);
    // console.log(`   GET    /usuarios/:id`);
    // console.log(`   PUT    /usuarios/:id`);
    // console.log(`   DELETE /usuarios/:id`);
    console.log(`\n Servidor listo para recibir peticiones\n`);
});
