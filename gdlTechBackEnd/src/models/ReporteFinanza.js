// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// /**
//  * Modelo de ReporteFinanza según el esquema de la base de datos
//  */
// const ReporteFinanzaSchema = new Schema({
//     reporte_id: { 
//         type: Number, 
//         required: true, 
//         unique: true 
//     },
//     condominio_id: { 
//         type: String, 
//         required: true, 
//         default: 'C500' 
//     },
//     concepto: { 
//         type: String, 
//         required: true 
//     },
//     fecha: { 
//         type: String, 
//         required: true 
//     },
//     monto: { 
//         type: Number, 
//         required: true 
//     },
//     categoria: { 
//         type: String, 
//         required: true 
//     },
//     descripcion: { 
//         type: String, 
//         default: '' 
//     },
//     usuario_id: { 
//         type: Number, 
//         required: true 
//     },
//     evidencia: {
//         imagen_url: { 
//             type: String, 
//             default: '' 
//         },
//         tipo_documento: { 
//             type: String, 
//             default: '' 
//         }
//     }
// }, {
//     timestamps: true,
//     versionKey: false
// });

// module.exports = mongoose.model('ReporteFinanza', ReporteFinanzaSchema, 'reporteFinanzas');

