const localConn = require('../../config/localConnection');
const CategoriaSchema = require('../schemas/CategoriaSchema');

module.exports = localConn.model('Categoria', CategoriaSchema, 'categorias');