const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGO_LOCAL = process.env.MONGO_LOCAL

const connectDB = async () => {
  try {
    //Verificamos que se encuentren las uris para la conexión
    if (!MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI no está definida en .env');
    }
    if (!MONGO_LOCAL) {
      console.warn('⚠️  MONGO_LOCAL no está definida en .env');
      return;
    }
    //Se hace el intento para conectar con el servidor en la nube
    console.log('🔁 Intentando conectar con MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5s de tiempo limite para intentar a Atlas
    });
    console.log('✅ MongoDB Atlas conectado exitosamente.');
  } catch (error) {
    console.error('❌ Error al conectar a Mongo Atlas:', error.message);
    console.warn('🔁 Intentando conectar a MongoDB Local...');

    try {
      await mongoose.connect(MONGO_LOCAL);
      console.log('✅ Conectado a MongoDB Local (modo fallback).');
    } catch (localError) {
      console.error('❌ Error al conectar a MongoDB local: ', localError.message);
      console.warn('⚠️  El servidor continuará sin base de datos. Algunas funciones pueden no funcionar.');
      // No salir del proceso, permitir que el servidor inicie
    }
  }
};

module.exports = connectDB;