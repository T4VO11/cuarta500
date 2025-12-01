const localConn = require('../../config/localConnection');
const IncidenteSchema = require('../schemas/IncidenteSchema');

module.exports = localConn.model('Incidente', IncidenteSchema, 'incidentes');