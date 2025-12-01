const atlasConn = require('../../config/atlasConnection');
const UsuarioSchema = require('../schemas/UsuarioSchema');

module.exports = atlasConn.model('Usuario', UsuarioSchema, 'usuarios');