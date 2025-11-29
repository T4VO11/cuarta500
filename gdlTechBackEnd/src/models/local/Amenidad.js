const localConn = require('../../config/localConnection');
const AmenidadSchema = require('../schemas/AmenidadSchema');

module.exports = localConn.model('Amenidad', AmenidadSchema, 'amenidades');