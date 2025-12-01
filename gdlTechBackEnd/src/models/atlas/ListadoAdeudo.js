const atlasConn = require('../../config/atlasConnection');
const ListadoAdeudoSchema = require('../schemas/ListadoAdeudoSchema');

module.exports = atlasConn.model('ListadoAdeudo', ListadoAdeudoSchema, 'listadoAdeudos');