const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB conectado exitosamente.');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1); 
  }
};

module.exports = connectDB;