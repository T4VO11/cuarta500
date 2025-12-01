const atlasConn = require('../../config/atlasConnection');
const BitacoraSchema = require('../schemas/BitacoraSchema');

module.exports = atlasConn.model('Bitacora', BitacoraSchema, 'bitacoras');