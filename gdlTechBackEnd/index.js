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
  
//Arrancamos el servidor PRIMERO (para que Render detecte que está listo)
const port = process.env.PORT || 3000;
const { setDefaultAutoSelectFamilyAttemptTimeout } = require('net');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads',express.static(path.join(__dirname, 'uploads')));

// Middleware CORS
// En desarrollo: solo localhost
// En producción: permite Netlify y apps móviles
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (apps móviles, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:4200',
            'http://127.0.0.1:4200',
            'http://localhost:3000',
            // Agregar aquí tu URL de Netlify cuando la tengas
            // 'https://tu-app.netlify.app',
            // En producción, puedes permitir todos los orígenes de Netlify:
            /^https:\/\/.*\.netlify\.app$/
        ];
        
        // En producción, permitir todos los orígenes (o configurar específicos)
        if (process.env.NODE_ENV === 'production') {
            // Opción 1: Permitir todos (menos seguro pero más fácil)
            return callback(null, true);
            
            // Opción 2: Solo orígenes específicos (más seguro)
            // if (allowedOrigins.some(allowed => {
            //     if (allowed instanceof RegExp) {
            //         return allowed.test(origin);
            //     }
            //     return allowed === origin;
            // })) {
            //     return callback(null, true);
            // }
            // return callback(new Error('Not allowed by CORS'));
        }
        
        // En desarrollo, solo localhost
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));


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

// Health check para Render (responde rápido sin depender de DB)
app.get('/health', function(req, res) {
    res.status(200).json({
        estado: 'exito',
        mensaje: 'Servidor funcionando',
        timestamp: new Date().toISOString()
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
    console.log(`\n Servidor listo para recibir peticiones\n`);
    
    // Arranque de sincronizadores EN BACKGROUND (no bloquea el servidor)
    // Esto permite que Render detecte que el servidor está listo inmediatamente
    (async () => {
        console.log("Iniciando sincronizadores en background...");
        
        // Función para esperar a que una conexión esté lista
        const waitForConnection = (connection, name, maxWait = 30000) => {
            return new Promise((resolve, reject) => {
                if (connection.readyState === 1) {
                    // Ya está conectado
                    console.log(`✅ ${name} ya está conectado`);
                    resolve();
                    return;
                }
                
                const timeout = setTimeout(() => {
                    connection.removeListener('connected', onConnected);
                    connection.removeListener('error', onError);
                    reject(new Error(`Timeout esperando conexión ${name}`));
                }, maxWait);
                
                const onConnected = () => {
                    clearTimeout(timeout);
                    connection.removeListener('error', onError);
                    console.log(`✅ ${name} conectado`);
                    resolve();
                };
                
                const onError = (err) => {
                    clearTimeout(timeout);
                    connection.removeListener('connected', onConnected);
                    console.warn(`⚠️ Error en ${name}:`, err.message);
                    // No rechazamos, solo continuamos (puede que la otra conexión funcione)
                    resolve();
                };
                
                connection.once('connected', onConnected);
                connection.once('error', onError);
            });
        };
        
        try {
            // Esperar a que las conexiones estén listas (con timeout)
            console.log("Esperando conexiones MongoDB...");
            await Promise.allSettled([
                waitForConnection(localConn, 'MongoDB Local', 10000),
                waitForConnection(atlasConn, 'MongoDB Atlas', 10000)
            ]);
            
            // Esperar un poco más para estabilidad
            await new Promise(r => setTimeout(r, 1000));
            
            console.log("Ejecutando initialSync en background...");
            // Ejecutar initialSync
            initialSync()
                .then(() => {
                    console.log("✅ initialSync completado");
                    console.log("Iniciando syncWorker (sincronizacion continua)...");
                    startSyncWorker();
                })
                .catch((error) => {
                    console.error('❌ initialSync fallo:', error.message);
                    // Iniciar syncWorker de todas formas
                    console.log("Iniciando syncWorker a pesar del error...");
                    startSyncWorker();
                });
        } catch (error) {
            console.error('❌ Error al iniciar syncs:', error.message);
            // Intentar de todas formas después de un delay
            setTimeout(() => {
                console.log("Reintentando initialSync después de error...");
                initialSync()
                    .then(() => {
                        console.log("✅ initialSync completado (reintento)");
                        startSyncWorker();
                    })
                    .catch((err) => {
                        console.error('❌ initialSync fallo en reintento:', err.message);
                        startSyncWorker();
                    });
            }, 5000);
        }
    })();
});
