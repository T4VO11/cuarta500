const atlasConn = require('../../config/atlasConnection');
const ReglamentoSchema = require('../schemas/ReglamentoSchema');

module.exports = atlasConn.model('Reglamento', ReglamentoSchema, 'reglamento');