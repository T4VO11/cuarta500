const atlasConn = require('../../config/atlasConnection');
const CategoriaSchema = require('../schemas/CategoriaSchema');

module.exports = atlasConn.model('Categoria', CategoriaSchema, 'categorias');