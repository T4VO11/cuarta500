// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// /**
//  * Modelo de Bitácora según el esquema de la base de datos
//  */
// const BitacoraSchema = new Schema({
//     registro_id: { 
//         type: Number, 
//         required: true, 
//         unique: true 
//     },
//     condominio_id: { 
//         type: String, 
//         required: true, 
//         default: 'C500' 
//     },
//     tipo_registro: { 
//         type: String, 
//         required: true 
//     },
//     fecha_hora: { 
//         type: String, 
//         required: true 
//     },
//     accion: { 
//         type: String, 
//         required: true 
//     },
//     usuario_id: { 
//         type: Number, 
//         required: true 
//     },
//     invitacion_id: { 
//         type: Number, 
//         default: null 
//     },
//     detalle_acceso: {
//         metodo: { 
//             type: String, 
//             default: '' 
//         },
//         numeroCasa: { 
//             type: Number, 
//             default: null 
//         },
//         placas: { 
//             type: String, 
//             default: '' 
//         },
//         notas: { 
//             type: String, 
//             default: '' 
//         },
//         nombre_visitante: { 
//             type: String, 
//             default: '' 
//         },
//         usuario_id: { 
//             type: Number, 
//             default: null 
//         },
//         codigo_acceso: { 
//             type: String, 
//             default: '' 
//         },
//         imagen_ine_url: { 
//             type: String, 
//             default: '' 
//         },
//         motivo: { 
//             type: String, 
//             default: '' 
//         },
//         vehiculo: {
//             modelo: { 
//                 type: String, 
//                 default: '' 
//             },
//             placas: { 
//                 type: String, 
//                 default: '' 
//             }
//         }
//     },
//     vehiculo: {
//         modelo: { 
//             type: String, 
//             default: '' 
//         },
//         placas: { 
//             type: String, 
//             default: '' 
//         }
//     }
// }, {
//     timestamps: true,
//     versionKey: false
// });

// module.exports = mongoose.model('Bitacora', BitacoraSchema, 'bitacoras');

