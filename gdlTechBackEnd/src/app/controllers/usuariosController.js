const Usuario = require('../../models/Usuario'); // RUTA CORREGIDA
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Necesitarás 'jsonwebtoken'

// Crear un nuevo usuario (Registro)
exports.crearUsuario = async (req, res) => {
    // NOTA: Esta función 'crearUsuario' ahora tiene dos lógicas:
    // 1. Registro público (ej. un admin se registra por primera vez)
    // 2. Creación por un dueño (ej. un dueño añade un habitante)
    // Para el caso 2, necesitaríamos 'authMiddleware' en la ruta.

    const { nombre, email, password, rol } = req.body;
    let { condominioId, dueñoId } = req.body; // Los IDs pueden variar

    // authInfo nos dirá si un usuario autenticado está creando a otro
    const authInfo = req.usuario; // Vendrá del authMiddleware (si la ruta está protegida)

    try {
        // 1. Verificar si el email ya existe
        let usuario = await Usuario.findOne({ email });
        if (usuario) {
            return res.status(400).json({ msg: 'El email ya está registrado' });
        }

        // 2. Crear nuevo usuario
        usuario = new Usuario(req.body);

        // LÓGICA DE JERARQUÍA (Dueño creando habitante)
        if (authInfo && authInfo.rol === 'dueño' && (rol === 'habitante' || rol === 'arrendatario')) {
            // Si el que crea es un 'dueño', forzamos los datos correctos
            usuario.dueñoId = authInfo.id; // El creador es el dueño
            usuario.condominioId = authInfo.condominioId; // Del condominio del dueño
        } else if (rol === 'habitante' || rol === 'arrendatario') {
            // Si no es un dueño creando (ej. un admin), el dueñoId debe venir en el body
            if (!dueñoId) {
                return res.status(400).json({ msg: 'Se requiere dueñoId para este rol' });
            }
        }
        // (Si es un admin creando a un 'dueño', el condominioId vendrá en el body)

        // 3. Hashear el password
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt);

        // 4. Guardar en BD
        await usuario.save();
        
        // Ocultamos password del objeto de respuesta
        usuario.password = undefined;

        res.status(201).json({ msg: 'Usuario creado exitosamente', usuario });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};

// Login de usuario
exports.loginUsuario = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Verificar si existe
        const usuario = await Usuario.findOne({ email }).select('+password'); // Incluir password
        if (!usuario) {
            return res.status(400).json({ msg: 'Email o password incorrectos' });
        }

        // 2. Verificar si está activo
        if (!usuario.activo) {
            return res.status(403).json({ msg: 'El usuario no está activo. Contacte al administrador.' });
        }

        // 3. Verificar password
        const passCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passCorrecto) {
            return res.status(400).json({ msg: 'Email o password incorrectos' });
        }

        // 4. Crear y firmar el JWT
        const payload = {
            usuario: {
                id: usuario.id,
                rol: usuario.rol,
                condominioId: usuario.condominioId
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Tu llave secreta en .env
            { expiresIn: '8h' }, // Duración del token
            (error, token) => {
                if (error) throw error;
                res.json({ token });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
};

// Obtener todos los usuarios DE MI CONDOMINIO
exports.obtenerUsuariosPorCondominio = async (req, res) => {
    try {
        // Obtenemos el condominioId del usuario autenticado (que viene en el JWT)
        // Esto asume que tienes un middleware de autenticación que pone 'req.usuario'
        const { condominioId, rol, id } = req.usuario; 

        let query = { condominioId: condominioId };

        // AÑADIDO: Si el rol es 'dueño', solo debe ver a sus habitantes/arrendatarios
        if (rol === 'dueño') {
            // Busca a los que él creó O a él mismo
            query = { 
                ...query,
                $or: [ { dueñoId: id }, { _id: id } ] 
            };
        }
        // Si es 'admin' o 'guardia', ve a todos (la query base es suficiente)
        // Si es 'habitante' o 'arrendatario', solo se verá a sí mismo (habría que ajustar)

        const usuarios = await Usuario.find(query);
        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
};

// Obtener un usuario por su ID
exports.obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // --- Lógica de autorización ---
        // Un usuario solo puede ver a otros dentro de su mismo condominio.
        if (usuario.condominioId.toString() !== req.usuario.condominioId) {
            return res.status(403).json({ msg: 'Acceso no autorizado' });
        }

        res.json(usuario);

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Usuario no encontrado (ID inválido)' });
        }
        res.status(500).send('Error en el servidor');
    }
};

// Actualizar un usuario
exports.actualizarUsuario = async (req, res) => {
    // Extraemos los campos que se pueden actualizar.
    // No permitimos cambiar rol, condominioId o dueñoId desde este endpoint.
    const { nombre, email, telefono } = req.body;
    const datosActualizados = { nombre, email, telefono };

    // Filtramos campos undefined para no sobreescribir con nada
    Object.keys(datosActualizados).forEach(key => datosActualizados[key] === undefined && delete datosActualizados[key]);

    try {
        let usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // --- Lógica de autorización ---
        // Solo un admin o el propio usuario pueden modificar sus datos.
        if (req.usuario.rol !== 'admin' && req.usuario.id !== usuario.id.toString()) {
            return res.status(403).json({ msg: 'No tienes permiso para actualizar este usuario' });
        }

        // Si se intenta cambiar el email, verificar que no esté ya en uso por otro usuario
        if (email && email !== usuario.email) {
            const emailExistente = await Usuario.findOne({ email });
            if (emailExistente) {
                return res.status(400).json({ msg: 'El email ya está en uso por otra cuenta' });
            }
        }

        usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { $set: datosActualizados },
            { new: true } // Devuelve el documento actualizado
        );

        res.json({ msg: 'Usuario actualizado correctamente', usuario });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
};

// Desactivar un usuario (Soft Delete)
exports.desactivarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Cambiamos el estado a inactivo
        usuario.activo = false;
        await usuario.save();

        res.json({ msg: 'Usuario desactivado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
};