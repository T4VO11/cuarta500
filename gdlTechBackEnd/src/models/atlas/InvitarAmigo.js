const atlasConn = require('../../config/atlasConnection');
const InvitarAmigoSchema = require('../schemas/InvitarAmigoSchema');

module.exports = atlasConn.model('InvitarAmigo', InvitarAmigoSchema, 'invitarAmigos');