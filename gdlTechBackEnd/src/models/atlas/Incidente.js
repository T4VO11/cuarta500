const atlasConn = require('../../config/atlasConnection');
const IncidenteSchema = require('../schemas/IncidenteSchema');

module.exports = atlasConn.model('Incidente', IncidenteSchema, 'incidentes');