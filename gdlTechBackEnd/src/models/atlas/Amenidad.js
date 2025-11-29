const atlasConn = require ('../../config/atlasConnection');
const AmenidadSchema = require ('../schemas/AmenidadSchema');

module.exports = atlasConn.model('Amenidad', AmenidadSchema, 'amenidades');