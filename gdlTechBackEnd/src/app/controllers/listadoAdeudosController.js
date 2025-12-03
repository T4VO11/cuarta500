const LocalListadoAdeudo = require('../../models/local/ListadoAdeudo');
const AtlasListadoAdeudo = require('../../models/atlas/ListadoAdeudo');

const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createDualWriter = require('../../utils/dualWriter');
const listadoAdeudoDW = createDualWriter(LocalListadoAdeudo, AtlasListadoAdeudo);


// ------------READS (index, show, disponibles usaran local. Más rápido y offline).
exports.index = async (req, res) => {
    try {
        // Si el usuario no es administrador, solo mostrar sus propios adeudos
        const usuario_id = req.usuario?.usuario_id;
        const esAdmin = req.usuario?.rol === 'administrador';
        
        let query = { condominio_id: 'C500' };
        if (!esAdmin && usuario_id) {
            query.usuario_id = usuario_id;
        }
        if (!esAdmin && !usuario_id) {
            return JsonResponse.error(res, 'Usuario no autenticado', 401)
        }

        const adeudos = await LocalListadoAdeudo.find(query)
            .sort({ transaccion_id: -1 });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Adeudos obtenidos exitosamente',
        //         data: adeudos
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, adeudos, 'Adeudos obtenidos exitosamente');
    } catch (error) {
        console.error('Error en index listadoAdeudos:', error);
        return JsonResponse.error(res, 'Error al obtener adeudos', 500);
    }
};

exports.show = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const adeudo = await LocalListadoAdeudo.findById(req.params.id);

        if (!adeudo) {
            return JsonResponse.notFound(res, 'Adeudo no encontrado');
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Adeudo obtenido exitosamente',
        //         data: adeudo
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, adeudo, 'Adeudo obtenido exitosamente');
    } catch (error) {
        console.error('Error en show listadoAdeudo:', error);
        return JsonResponse.error(res, 'Error al obtener adeudo', 500);
    }
};

// ------------ CREATE (usando dualWriter) ------------ 
exports.store = async (req, res) => {
    try {
        const {
            transaccion_id,
            tipo_registro,
            usuario_id,
            periodo_cubierto,
            monto_base,
            monto_total_pagado,
            fecha_pago,
            fecha_limite_pago,
            estado,
            dashboard_id,
            tipo,
            periodo,
            total_unidades,
            unidades_pagadas,
            unidades_pendientes,
            monto_recaudado,
            pasarela_pago,
            estado_casas
        } = req.body;

        const adeudoExistente = await LocalListadoAdeudo.findOne({ transaccion_id });
        if (adeudoExistente) {
            return JsonResponse.error(res, 'El transaccion_id ya existe', 400);
        }

        let parsedEstadoCasas = [];
        if (estado_casas !== undefined) {
            try {
                const temp = typeof estado_casas === "string" ? JSON.parse(estado_casas) : estado_casas;
                parsedEstadoCasas = Array.isArray(temp) ? temp : [];
            } catch {
                parsedEstadoCasas = [];
            }
        }
        // Construimos un objeto plano, en lugar de la instancia Mongoose
        const payload = {
            transaccion_id,
            condominio_id: 'C500',
            tipo_registro,
            usuario_id,
            periodo_cubierto,
            monto_base,
            monto_total_pagado: monto_total_pagado ?? null,
            fecha_pago: fecha_pago ?? null,
            fecha_limite_pago,
            estado: estado || 'pendiente',
            dashboard_id: dashboard_id || null,
            tipo: tipo ?? null,
            periodo: periodo ?? null,
            total_unidades: total_unidades ?? null,
            unidades_pagadas: unidades_pagadas ?? null,
            unidades_pendientes: unidades_pendientes ?? null,
            monto_recaudado: monto_recaudado ?? null,
            pasarela_pago: pasarela_pago ? (typeof pasarela_pago === 'string' ? JSON.parse(pasarela_pago) : pasarela_pago) : {},
            estado_casas: parsedEstadoCasas
        };

        // creamos con dualwrite Local -> Atlas (Si falla, lo encola)
        const nuevoAdeudoLocal = await listadoAdeudoDW.create(payload); 

        return JsonResponse.success(res, nuevoAdeudoLocal, 'Adeudo creado exitosamente', 201);
    } catch (error) {
        console.error('Error en store listadoAdeudo:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El transaccion_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear adeudo', 500);
    }
};

// ------------ UPDATE (usa dualWriter) ------------ 
exports.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const adeudo = await LocalListadoAdeudo.findById(req.params.id);
        if (!adeudo) {
            return JsonResponse.notFound(res, 'Adeudo no encontrado');
        }

        const camposPermitidos = [
            'tipo_registro', 'usuario_id', 'periodo_cubierto', 'monto_base',
            'monto_total_pagado', 'fecha_pago', 'fecha_limite_pago', 'estado',
            'dashboard_id', 'tipo', 'periodo', 'total_unidades', 'unidades_pagadas',
            'unidades_pendientes', 'monto_recaudado', 'pasarela_pago', 'estado_casas'
        ];

        // Armado de updates para dualWrite
        const updates = {};
        updates.condominio_id = 'C500';

        camposPermitidos.forEach(campo => {
            if (req.body[campo] !== undefined) {
                if (campo === 'pasarela_pago') {
                    try {
                        updates[campo] = typeof req.body[campo] === 'string' ? JSON.parse(req.body[campo]) : req.body[campo];
                    } catch {
                        updates[campo] = req.body[campo];
                    }
                } else if (campo === 'estado_casas') {
                    try {
                        updates[campo] = Array.isArray(req.body[campo]) ? req.body[campo] : JSON.parse(req.body[campo]);
                    } catch {
                        updates[campo] = req.body[campo];
                    }
                } else {
                    updates[campo] = req.body[campo];
                }
            }
        });

        const updated = await listadoAdeudoDW.update(req.params.id, updates);

        const adeudoObj = updated.toObject();

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Adeudo actualizado exitosamente',
        //         data: adeudo
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, adeudoObj, 'Adeudo actualizado exitosamente');
    } catch (error) {
        console.error('Error en update listadoAdeudo:', error);
        return JsonResponse.error(res, 'Error al actualizar adeudo', 500);
    }
};

exports.destroy = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const adeudo = await LocalListadoAdeudo.findById(req.params.id);
        if (!adeudo) {
            return JsonResponse.notFound(res, 'Adeudo no encontrado');
        }

        // dualWrite (eliminar Local -> Atlas)
        await listadoAdeudoDW.delete(req.params.id);

        return JsonResponse.success(res, null, 'Adeudo eliminado exitosamente', 204);
    } catch (error) {
        console.error('Error en destroy listadoAdeudo:', error);
        return JsonResponse.error(res, 'Error al eliminar adeudo', 500);
    }
};

// Endpoint para usuarios normales: obtener adeudos del usuario autenticado
exports.misAdeudos = async (req, res) => {
    try {
        // Obtener usuario_id del token
        const usuario_id = req.usuario?.usuario_id;
        
        if (!usuario_id) {
            return JsonResponse.error(res, 'Usuario no autenticado', 401);
        }

        // Buscar adeudos del usuario
        const adeudos = await LocalListadoAdeudo.find({ 
            condominio_id: 'C500',
            usuario_id: usuario_id
        })
        .sort({ transaccion_id: -1 });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Adeudos obtenidos exitosamente',
        //         data: adeudos
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, adeudos, 'Adeudos obtenidos exitosamente');
    } catch (error) {
        console.error('Error en misAdeudos:', error);
        return JsonResponse.error(res, 'Error al obtener adeudos', 500);
    }
};

// ==========================================
// NUEVO: CREAR SESIÓN DE PAGO DE MANTENIMIENTO
// ==========================================
exports.crearSesionMantenimiento = async (req, res) => {
    try {
        // Recibimos los datos del formulario de Angular
        const { nombre, numero_casa, periodo_cubierto, usuario_id } = req.body;

        if (!nombre || !numero_casa || !periodo_cubierto) {
            return JsonResponse.error(res, 'Faltan datos obligatorios', 400);
        }

        // Creamos la sesión de Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: `Mantenimiento: ${periodo_cubierto}`,
                        description: `Casa ${numero_casa} - ${nombre}`,
                    },
                    unit_amount: 100000, // $1,000.00 MXN Fijo
                },
                quantity: 1,
            }],
            mode: 'payment',
            // URLs de redirección (Ajusta la ruta según tus componentes nuevos)
            success_url: 'http://localhost:4200/main/listadoAdeudos/exito?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:4200/main/listadoAdeudos/create', 
            
            // GUARDAMOS LA INFO EN METADATA PARA USARLA AL CONFIRMAR
            metadata: {
                tipo_pago: 'mantenimiento',
                nombre: nombre,
                numero_casa: String(numero_casa),
                periodo_cubierto: periodo_cubierto,
                usuario_id: usuario_id || '0', // Guardamos el ID del usuario
                condominio_id: 'C500'
            }
        });

        return JsonResponse.success(res, { url: session.url }, 'Sesión creada');

    } catch (error) {
        console.error('Error Stripe Mantenimiento:', error);
        return JsonResponse.error(res, 'Error al conectar con Stripe', 500);
    }
};

// ==========================================
// NUEVO: CONFIRMAR PAGO Y CREAR REGISTRO
// ==========================================
exports.confirmarPagoMantenimiento = async (req, res) => {
    try {
        const { session_id } = req.body;
        
        if (!session_id) return JsonResponse.error(res, 'Falta session_id', 400);

        // 1. Verificar con Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            
            // 2. Verificar si ya existe para no duplicar
            const pagoExistente = await ListadoAdeudo.findOne({ transaccion_id: session.payment_intent });
            
            if (pagoExistente) {
                return JsonResponse.success(res, pagoExistente, 'Pago ya registrado previamente');
            }

            // 3. Recuperar datos de Metadata
            const datos = session.metadata;

            // 4. Crear el registro en MongoDB
            const nuevoAdeudo = new ListadoAdeudo({
                transaccion_id: session.payment_intent, // ID real de Stripe
                condominio_id: datos.condominio_id,
                tipo_registro: 'pago_mantenimiento',
                usuario_id: Number(datos.usuario_id),
                periodo_cubierto: datos.periodo_cubierto,
                monto_base: 1000,
                monto_total_pagado: session.amount_total / 100, // Convertir centavos a pesos
                fecha_pago: new Date(), // Fecha actual
                estado: 'confirmado', // Ya está pagado
                tipo: 'Ingreso',
                pasarela_pago: {
                    nombre: 'stripe',
                    numero_transaccion: session.payment_intent
                },

                fecha_limite_pago: new Date(),
                // Campos adicionales requeridos por tu modelo pero opcionales aquí
                nombre: datos.nombre, // OJO: Si tu modelo no tiene 'nombre' en raíz, quítalo
                estado_casas: [] // Array vacío por defecto
            });

            await nuevoAdeudo.save();

            return JsonResponse.success(res, nuevoAdeudo, 'Pago registrado correctamente');
        } else {
            return JsonResponse.error(res, 'El pago no se completó', 400);
        }

    } catch (error) {
        console.error('Error confirmando mantenimiento:', error);
        return JsonResponse.error(res, 'Error al confirmar pago', 500);
    }
};

