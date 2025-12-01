const atlasConn = require('../../config/atlasConnection');
const ReservacionSchema = require('../schemas/ReservacionSchema');

module.exports = atlasConn.model('Reservacion', ReservacionSchema, 'reservaciones');