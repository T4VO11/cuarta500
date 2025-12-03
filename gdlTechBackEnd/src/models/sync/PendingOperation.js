// models/sync/PendingOperation.js
const mongoose = require('mongoose');
const localConn = require('../../config/localConnection');

const PendingOperationSchema = new mongoose.Schema(
  {
    model: {
      //corresponde a la coleccion afectada: creada, actualizada o eliminada
      type: String,
      required: true,
    //   enum: ['amenidades', 'bitacoras', 'categorias', 'incidentes', 'invitarAmigos', 'listadoAdeudos', 'reglamento', 'reporteFinanzas', 'reservaciones', 'usuarios'] 
    //Quitar el enum permite escalabilidad y no tener que volver a editar este archivo si se agregan nuevas colecciones
    },

    operation: {
      //El tipo de operacion realizada
      type: String,
      required: true,
      enum: ['create', 'update', 'delete']
    },

    documentId: {
      //La referencia del documento original en Mongo Local. Para buscarlo y aplicar la operación correspondiente.
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    payload: {
      //Se guarda el documento para la operación que lo requiere. 
        //create: todo el documento
        //update: solo diferencias o nuevo documento
        //delete: puede ir vacío
      type: Object,
      required: false,
      default: {}
    },

    errorCount: {
      //Para saber cuántas veces falló la operación
        //reintentos exponenciales
        //marcar operaciones “muertas”
        //alertar al administrador
      type: Number,
      default: 0
    },

    lastAttempt: {
      //Ultimo intento
      type: Date
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

module.exports = localConn.model('PendingOperation', PendingOperationSchema, 'pending_operations');
