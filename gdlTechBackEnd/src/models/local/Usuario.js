const localConn = require('../../config/localConnection');
const UsuarioSchema = require('../schemas/UsuarioSchema');
 
module.exports = localConn.model('Usuario', UsuarioSchema, 'usuarios');