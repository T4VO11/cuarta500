require('dotenv').config();
const xprs = require('express');
const app= xprs();

const connectDB = require('./src/config/mongoose'); 
connectDB();

const port=3000;
const cors = require('cors');


app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(xprs.json());
app.use(xprs.static('uploads'));



const Rutasbitacoras = require('./bitacoras');
const Rutasincidentes = require('./incidentes');
const RutasinvitarAmigos = require('./invitarAmigos');
const RutaslistadoAdeudos = require('./listadoAdeudos');
const Rutaspagos = require('./pagos');
const Rutasreglamentos = require('./reglamentos');
const RutasreporteFinanzas = require('./reporteFinanzas');
const Rutasreservaciones = require('./reservaciones');
const Rutasusuarios = require('./usuarios');



app.use('/bitacoras', Rutasbitacoras);
app.use('/incidentes', Rutasincidentes);
app.use('/invitarAmigos', RutasinvitarAmigos);
app.use('/listadoAdeudos', RutaslistadoAdeudos);
app.use('/pagos', Rutaspagos);
app.use('/reglamentos', Rutasreglamentos);
app.use('/reporteFinanzas', RutasreporteFinanzas);
app.use('/reservaciones', Rutasreservaciones);
app.use('/usuarios', Rutasusuarios);



app.get('/', function(req,res){
  res.send('Bienvenidos a GDLTech')
});


app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));