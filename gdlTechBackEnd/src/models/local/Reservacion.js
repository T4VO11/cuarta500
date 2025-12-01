const localConn = require('../../config/localConnection');
const ReservacionSchema = require('../schemas/ReservacionSchema');

module.exports = localConn.model('Reservacion', ReservacionSchema, 'reservaciones');