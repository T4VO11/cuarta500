const atlasConn = require('../../config/atlasConnection');
const ReporteFinanzaSchema = require('../schemas/ReporteFinanzaSchema');

module.exports = atlasConn.model('ReporteFinanza', ReporteFinanzaSchema, 'reporteFinanzas');