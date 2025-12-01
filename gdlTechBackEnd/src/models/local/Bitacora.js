const localConn = require('../../config/localConnection');
const BitacoraSchema = require('../schemas/BitacoraSchema');

module.exports = localConn.model('Bitacora', BitacoraSchema, 'bitacoras');