const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI no está definida en .env');
      return;
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado exitosamente.');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.warn('⚠️  El servidor continuará sin MongoDB. Algunas funciones pueden no funcionar.');
    // No salir del proceso, permitir que el servidor inicie
  }
};

module.exports = connectDB;