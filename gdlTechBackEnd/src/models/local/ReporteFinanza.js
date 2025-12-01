const localConn = require('../../config/localConnection');
const ReporteFinanzaSchema = require('../schemas/ReporteFinanzaSchema');

module.exports = localConn.model('ReporteFinanza', ReporteFinanzaSchema, 'reporteFinanzas');