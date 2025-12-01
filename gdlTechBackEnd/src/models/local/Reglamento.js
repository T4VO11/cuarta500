const localConn = require('../../config/localConnection');
const ReglamentoSchema = require('../schemas/ReglamentoSchema');

module.exports = localConn.model('Reglamento', ReglamentoSchema, 'reglamento');