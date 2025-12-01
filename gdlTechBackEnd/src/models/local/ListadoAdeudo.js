const localConn = require('../../config/localConnection');
const ListadoAdeudoSchema = require('../schemas/ListadoAdeudoSchema');

module.exports = localConn.model('ListadoAdeudo', ListadoAdeudoSchema, 'listadoAdeudos');