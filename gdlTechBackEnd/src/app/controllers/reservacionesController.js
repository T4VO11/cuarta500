const LocalReservacion = require('../../models/local/Reservacion');
const AtlasReservacion = require('../../models/atlas/Reservacion');
const LocalUsuario = require('../../models/local/Usuario')
const LocalAmenidad = require('../../models/local/Amenidad');

const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const Amenidad = require('../../models/Amenidad'); // Necesario para sacar los precios
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createDualWriter = require('../../utils/dualWriter');
const reservacionesDW = createDualWriter(LocalReservacion, AtlasReservacion);

// ------------READS (index, show, disponibles usaran local. Más rápido y offline).
exports.index = async (req, res) => {
    try {
        const reservaciones = await LocalReservacion.find()
            .sort({ reservacion_id: -1 });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reservaciones obtenidas exitosamente',
        //         data: reservaciones
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reservaciones, 'Reservaciones obtenidas exitosamente');
    } catch (error) {
        console.error('Error en index reservaciones:', error);
        return JsonResponse.error(res, 'Error al obtener reservaciones', 500);
    }
};

exports.show = async (req, res) => {
    try {
        let reservacion;

        // Intentar buscar por ObjectId primero
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            reservacion = await LocalReservacion.findById(req.params.id);
        }
        
        // Si no se encontró por ObjectId, intentar por reservacion_id
        if (!reservacion) {
            const reservacionIdNum = parseInt(req.params.id);
            if (!isNaN(reservacionIdNum)) {
                reservacion = await LocalReservacion.findOne({ reservacion_id: reservacionIdNum });
            }
        }

        // Validar que la reservación exista
        if (!reservacion) {
            return JsonResponse.notFound(res, 'Reservación no encontrada');
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reservación obtenida exitosamente',
        //         data: reservacion
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reservacion.toObject(), 'Reservación obtenida exitosamente');
    } catch (error) {
        console.error('Error en show reservacion:', error);
        return JsonResponse.error(res, 'Error al obtener reservación', 500);
    }
};

exports.store = async (req, res) => {
    try {
        const {
            reservacion_id,
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra,
            total,
            estado,
            estado_pago
        } = req.body;

        const reservacionExistente = await LocalReservacion.findOne({ reservacion_id });
        if (reservacionExistente) {
            return JsonResponse.error(res, 'El reservacion_id ya existe', 400);
        }

        // Parse seguro de servicios_extra
        let servicios = servicios_extra;
        try {
            if (typeof servicios_extra === 'string') {
                servicios = JSON.parse(servicios_extra);
            }
            } catch {
                servicios = servicios_extra;
        }

        // Obtener usuario_id del token si está disponible (para admins que crean reservaciones)
        const usuario_id = req.usuario?.usuario_id;

        const payload ={
            reservacion_id,
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra: servicios || [],
            total,
            estado: estado || 'pendiente',
            estado_pago: estado_pago || 'pendiente',
            usuario_id: usuario_id ?? null
        };

        // Usamos dualWriter para crear Local -> Atlas, si falla lo encola
        const nuevaReservacionLocal = await reservacionesDW.create(payload);

        return JsonResponse.success(res, nuevaReservacionLocal, 'Reservación creada exitosamente', 201);
    } catch (error) {
        console.error('Error en store reservacion:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El reservacion_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear reservación', 500);
    }
};

// Endpoint para usuarios normales: crear reservación
exports.crear = async (req, res) => {
    try {
        // Obtener usuario_id del token JWT
        const usuario_id = req.usuario?.usuario_id;
        if (!usuario_id) {
            return JsonResponse.error(res, 'Usuario no identificado', 401);
        }

        const {
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra,
            total,
            estado,
            estado_pago
        } = req.body;

        // Generar el siguiente reservacion_id
        const ultimaReservacion = await LocalReservacion.findOne().sort({ reservacion_id: -1 });
        let reservacion_id = ultimaReservacion ? ultimaReservacion.reservacion_id + 1 : 1;

        // Verificar que no exista (por si acaso)
        const reservacionExistente = await LocalReservacion.findOne({ reservacion_id });
        if (reservacionExistente) {
            // Si existe, buscar el siguiente disponible
            while (await LocalReservacion.findOne({ reservacion_id })) {
                reservacion_id++;
            }
        }

        // parse seguro servicios_extra
        let servicios = [];
        if (servicios_extra !== undefined && servicios_extra !== null && servicios_extra !== '') {
            try { 
                servicios = Array.isArray(servicios_extra) ? servicios_extra : JSON.parse(servicios_extra); 
            } catch { 
                servicios = []; 
            }
        }

        // Convertir usuario_id a Number para asegurar que coincida con el tipo en la BD
        const usuarioIdNum = Number(usuario_id);
        
        const payload = {
            reservacion_id,
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra: servicios,
            total,
            estado: estado || 'pendiente',
            estado_pago: estado_pago || 'pendiente',
            usuario_id: usuarioIdNum
        };

        // Creamos con dualWrite inserta Local e intenta en Atlas. Si falla, lo encola
        const crearReservacionLocal = await reservacionesDW.create(payload);

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reservación creada exitosamente',
        //         data: nuevaReservacion
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, crearReservacionLocal, 'Reservación creada exitosamente', 201);
    } catch (error) {
        console.error('Error en crear reservacion:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El reservacion_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear reservación', 500);
    }
};

exports.update = async (req, res) => {
    try {
        let reservacion;
        
        // Intentar buscar por ObjectId primero
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            reservacion = await LocalReservacion.findById(req.params.id);
        }
        
        // Si no se encontró por ObjectId, intentar por reservacion_id
        if (!reservacion) {
            const reservacionIdNum = parseInt(req.params.id);
            if (!isNaN(reservacionIdNum)) {
                reservacion = await LocalReservacion.findOne({ reservacion_id: reservacionIdNum });
            }
        }
        
        // Validar que la reservación exista
        if (!reservacion) {
            return JsonResponse.notFound(res, 'Reservación no encontrada');
        }

        const {
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra,
            total,
            estado,
            estado_pago
        } = req.body;

        // Creamos variable updates para dualWrite
        const updates = {};
        // updates.condominio_id = 'C500'; //TODAVIA NO ESTA DE ALTA EN LA COLECCION
        if (nombre_residente !== undefined) updates.nombre_residente = nombre_residente;
        if (telefono !== undefined) updates.telefono = telefono;
        if (fecha_evento !== undefined) updates.fecha_evento = fecha_evento;
        if (servicios_extra !== undefined) {
            try {
                updates.servicios_extra = Array.isArray(servicios_extra) ? servicios_extra : JSON.parse(servicios_extra);
            } catch {
                updates.servicios_extra = servicios_extra;
            }
        }
        if (total !== undefined) updates.total = total;
        if (estado !== undefined) updates.estado = estado;
        if (estado_pago !== undefined) updates.estado_pago = estado_pago;

        // Actualizamos con dualWrite. Local -> Atlas, si falla lo encola
            // Usamos el ._id real del documento para dualWriter
        const updated = await reservacionesDW.update(reservacion._id, updates)

        const reservacionObj = updated.toObject();
        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reservación actualizada exitosamente',
        //         data: reservacion
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reservacionObj, 'Reservación actualizada exitosamente');
    } catch (error) {
        console.error('Error en update reservacion:', error);
        return JsonResponse.error(res, 'Error al actualizar reservación', 500);
    }
};

exports.destroy = async (req, res) => {
    try {
        let reservacion;
        
        // Intentar buscar por ObjectId primero
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            reservacion = await LocalReservacion.findById(req.params.id);
        }
        
        if (!reservacion) {
            const reservacionIdNum = parseInt(req.params.id);
            if (!isNaN(reservacionIdNum)) {
                reservacion = await LocalReservacion.findOne({ reservacion_id: reservacionIdNum });
            }
        }

        if (!reservacion) {
            return JsonResponse.notFound(res, "Reservacion no encontrada");
        }

        // Delete con dualWriter
        await reservacionesDW.delete(reservacion._id);

        return JsonResponse.success(res, null, "Reservacion eliminada exitosamente");

    } catch (error) {
        console.error('Error en destroy reservacion:', error);
        return JsonResponse.error(res, 'Error al eliminar reservación', 500);
    }
};

// Endpoint para usuarios normales: obtener reservaciones del usuario autenticado
exports.misReservaciones = async (req, res) => {
    try {
        // Obtener usuario_id del token JWT (viene en req.usuario del middleware de autenticación)
        const usuario_id = req.usuario?.usuario_id;
        
        console.log('misReservaciones - req.usuario:', req.usuario);
        console.log('misReservaciones - usuario_id:', usuario_id);
        
        if (!usuario_id) {
            return JsonResponse.error(res, 'Usuario no identificado', 401);
        }

        // Convertir usuario_id a Number para asegurar que coincida con el tipo en la BD
        const usuarioIdNum = Number(usuario_id);
        
        if (isNaN(usuarioIdNum)) {
            console.error('misReservaciones - usuario_id no es un número válido:', usuario_id);
            return JsonResponse.error(res, 'ID de usuario inválido', 400);
        }
        
        // Obtener datos del usuario autenticado para comparar por nombre/telefono si no hay usuario_id
        const usuario = await LocalUsuario.findOne({ usuario_id: usuarioIdNum });
        let nombreCompletoUsuario = null;
        let telefonoUsuario = null;
        
        if (usuario) {
            nombreCompletoUsuario = `${usuario.nombre} ${usuario.apellido_paterno} ${usuario.apellido_materno}`.trim().toLowerCase();
            telefonoUsuario = usuario.telefono;
            console.log('misReservaciones - Usuario encontrado:', {
                usuario_id: usuarioIdNum,
                nombre_completo: nombreCompletoUsuario,
                telefono: telefonoUsuario
            });
        } else {
            console.warn('misReservaciones - Usuario no encontrado en BD para usuario_id:', usuarioIdNum);
        }
        
        // Buscar reservaciones de dos formas:
        // 1. Por usuario_id (reservaciones nuevas)
        // 2. Por nombre_residente o telefono (reservaciones antiguas sin usuario_id)
        const queryPorUsuarioId = { usuario_id: usuarioIdNum };
        
        // Construir query alternativa para reservaciones sin usuario_id
        const queryAlternativa = {
            $and: [
                { $or: [
                    { usuario_id: { $exists: false } },
                    { usuario_id: null },
                    { usuario_id: undefined }
                ]}
            ]
        };
        
        // Si tenemos datos del usuario, agregar condiciones de nombre o teléfono
        if (nombreCompletoUsuario || telefonoUsuario) {
            const condicionesNombreTelefono = [];
            if (nombreCompletoUsuario) {
                condicionesNombreTelefono.push({ 
                    nombre_residente: { $regex: new RegExp(nombreCompletoUsuario.split(' ')[0], 'i') } 
                });
            }
            if (telefonoUsuario) {
                condicionesNombreTelefono.push({ telefono: telefonoUsuario });
            }
            if (condicionesNombreTelefono.length > 0) {
                queryAlternativa.$and.push({ $or: condicionesNombreTelefono });
            }
        }
        
        // Buscar reservaciones con usuario_id
        const reservacionesPorUsuarioId = await LocalReservacion.find(queryPorUsuarioId)
            .sort({ reservacion_id: -1 });
        
        // Buscar reservaciones sin usuario_id pero que coincidan por nombre o teléfono
        let reservacionesPorNombreTelefono = [];
        if (nombreCompletoUsuario || telefonoUsuario) {
            reservacionesPorNombreTelefono = await LocalReservacion.find(queryAlternativa)
                .sort({ reservacion_id: -1 });
        }
        
        // Combinar ambas búsquedas y eliminar duplicados
        const todasLasReservaciones = [...reservacionesPorUsuarioId, ...reservacionesPorNombreTelefono];
        const reservacionesUnicas = todasLasReservaciones.filter((r, index, self) => 
            index === self.findIndex((res) => res._id.toString() === r._id.toString())
        );
        
        console.log(`misReservaciones - Encontradas ${reservacionesPorUsuarioId.length} por usuario_id, ${reservacionesPorNombreTelefono.length} por nombre/teléfono, ${reservacionesUnicas.length} totales únicas`);
        
        // Validar que todas las reservaciones devueltas pertenezcan al usuario
        const reservacionesValidadas = reservacionesUnicas.filter(r => {
            // Si tiene usuario_id, debe coincidir
            if (r.usuario_id !== null && r.usuario_id !== undefined) {
                const rUsuarioId = Number(r.usuario_id);
                if (!isNaN(rUsuarioId) && rUsuarioId === usuarioIdNum) {
                    return true;
                }
                return false;
            }
            
            // Si no tiene usuario_id, verificar por nombre o teléfono
            if (nombreCompletoUsuario) {
                const nombreReserva = (r.nombre_residente || '').toLowerCase();
                const nombreUsuarioPrimero = nombreCompletoUsuario.split(' ')[0];
                if (nombreReserva.includes(nombreUsuarioPrimero)) {
                    // Actualizar la reservación con el usuario_id para futuras búsquedas
                    r.usuario_id = usuarioIdNum;
                    r.save().catch(err => console.error('Error al actualizar usuario_id en reservación:', err));
                    return true;
                }
            }
            
            if (telefonoUsuario && r.telefono === telefonoUsuario) {
                // Actualizar la reservación con el usuario_id para futuras búsquedas
                r.usuario_id = usuarioIdNum;
                r.save().catch(err => console.error('Error al actualizar usuario_id en reservación:', err));
                return true;
            }
            
            return false;
        });
        
        console.log(`misReservaciones - Reservaciones validadas: ${reservacionesValidadas.length} de ${reservacionesUnicas.length}`);
        
        // SIEMPRE devolver solo las reservaciones validadas
        const reservacionesFinales = reservacionesValidadas;

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reservaciones obtenidas exitosamente',
        //         data: reservacionesFinales
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reservacionesFinales, 'Reservaciones obtenidas exitosamente');
    } catch (error) {
        console.error('Error en misReservaciones:', error);
        return JsonResponse.error(res, 'Error al obtener reservaciones', 500);
    }  
};

exports.crearSesionPago = async (req, res) => {
    try {
        // 1. Recibimos el ID de la amenidad y los nombres de los extras
        const { amenidadId, extrasSeleccionados, reservacionId } = req.body;

        if (!amenidadId) {
            return JsonResponse.error(res, 'Falta el ID de la amenidad', 400);
        }

        // 2. BUSCAMOS LA AMENIDAD EN LA BD (Fuente de verdad de precios)
        const amenidad = await LocalAmenidad.findOne({ amenidad_id: amenidadId });
        // O si usas _id de mongo: const amenidad = await Amenidad.findById(amenidadId);

        if (!amenidad) {
            return JsonResponse.error(res, 'Amenidad no encontrada', 404);
        }

        // 3. CONSTRUIMOS LOS ITEMS PARA STRIPE (Calculado en Backend por seguridad)
        const lineItems = [];

        // A) Costo Base (Extraído de reglas_apartado)
        // Usamos nullish coalescing (??) para asegurar que sea 0 si no existe
        const costoBase = amenidad.reglas_apartado?.costo_apartado ?? 0;
        
        if (costoBase > 0) {
            lineItems.push({
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: `Reserva: ${amenidad.nombre}`,
                        description: 'Costo base por uso de amenidad',
                    },
                    unit_amount: Math.round(costoBase * 100), // Stripe usa centavos
                },
                quantity: 1,
            });
        }

        // B) Servicios Extra
        const extrasDisponibles = amenidad.reglas_apartado?.extras_disponibles || [];
        
        // Si el usuario mandó extras, buscamos sus precios reales en la BD
        if (extrasSeleccionados && extrasSeleccionados.length > 0) {
            extrasDisponibles.forEach(extraBD => {
                // Comparamos por nombre (asegúrate que coincidan exactamente con el frontend)
                if (extrasSeleccionados.includes(extraBD.nombre)) {
                    lineItems.push({
                        price_data: {
                            currency: 'mxn',
                            product_data: {
                                name: `Extra: ${extraBD.nombre}`,
                                description: extraBD.descripcion || 'Servicio adicional',
                            },
                            unit_amount: Math.round(extraBD.costo * 100), // Precio real de la BD
                        },
                        quantity: 1,
                    });
                }
            });
        }

        // Validación: Stripe no permite cobrar $0
        if (lineItems.length === 0) {
             return JsonResponse.error(res, 'El monto total es $0, no se requiere pasarela de pago.', 400);
        }

        // 4. CREAMOS LA SESIÓN DE CHECKOUT
        // Nota: Ajusta las URLs de success y cancel según tus rutas de Angular
        // 4. AL CREAR LA SESIÓN, GUARDAMOS EL ID EN METADATA
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: 'http://localhost:4200/main/reservaciones/exito?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:4200/main/reservaciones/cancelado',
            metadata: {
                amenidadId: amenidadId,
                // --- AQUÍ GUARDAMOS EL ID PARA RECUPERARLO DESPUÉS ---
                reservacionId: reservacionId || null, 
                // -----------------------------------------------------
                usuarioId: req.usuario?.usuario_id || 'invitado',
                extras: JSON.stringify(extrasSeleccionados)
            }
        });

        // 5. DEVOLVEMOS LA URL PARA QUE ANGULAR REDIRIJA
        return JsonResponse.success(res, { url: session.url }, 'Sesión de pago creada');

    } catch (error) {
        console.error('Error al crear sesión de pago Stripe:', error);
        return JsonResponse.error(res, 'Error al conectar con Stripe', 500);
    }
};

// ==========================================
// VERIFICAR Y ACTUALIZAR RESERVACIÓN
// ==========================================
exports.confirmarPago = async (req, res) => {
    try {
        const { session_id } = req.body;

        if (!session_id) {
            return JsonResponse.error(res, 'Falta el session_id', 400);
        }

        // 1. PREGUNTAR A STRIPE EL ESTADO REAL
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            // 2. RECUPERAR EL ID DE LA RESERVACIÓN DE LOS METADATOS
            const reservacionId = session.metadata.reservacionId;

            if (reservacionId) {
                // 3. ACTUALIZAR LA BASE DE DATOS
                const reservacionActualizada = await LocalReservacion.findByIdAndUpdate(
                    reservacionId,
                    { 
                        estado_pago: 'pagado',
                        estado: 'confirmada', // Opcional: Confirmamos la reserva también
                        // Guardamos el ID de transacción de Stripe para referencia
                        'transaccion_detalle.transaccion_id': session.payment_intent 
                    },
                    { new: true }
                );

                return JsonResponse.success(res, reservacionActualizada, 'Pago confirmado y reservación actualizada');
            } else {
                // Caso: Pago de una reservación nueva que no existía en BD (lógica futura)
                return JsonResponse.success(res, null, 'Pago exitoso (sin reservación previa vinculada)');
            }
        } else {
            return JsonResponse.error(res, 'El pago no se ha completado', 400);
        }

    } catch (error) {
        console.error('Error al confirmar pago:', error);
        return JsonResponse.error(res, 'Error al verificar la sesión con Stripe', 500);
    }
};

