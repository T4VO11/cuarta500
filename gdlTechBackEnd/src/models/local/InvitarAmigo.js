const localConn = require('../../config/localConnection');
const InvitarAmigoSchema = require('../schemas/InvitarAmigoSchema');

module.exports = localConn.model('InvitarAmigo', InvitarAmigoSchema, 'invitarAmigos');