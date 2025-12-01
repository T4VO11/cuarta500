const LocalUsuario = require('../../models/local/Usuario');
const AtlasUsuario = require('../../models/atlas/Usuario');

const jwt = require('jsonwebtoken');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const { buildImageUrl } = require('../../utils/imageUrlHelper');
const tokenBlacklist = require('../../utils/tokenBlacklist');

const createDualWriter = require('../../utils/dualWriter');
const usuarioDW = createDualWriter(LocalUsuario, AtlasUsuario);

/**
 * Obtener todos los usuarios INDEX LOCAL
 * GET /usuarios 
 * READ contra Local ( + rapidez y eficiencia)
 */
exports.index = async (req, res) => {
    try {
        const usuarios = await LocalUsuario.find({ condominio_id: 'C500' })
            .sort({ usuario_id: 1 });
        
        // Construir URLs públicas para imágenes
        const usuariosConUrls = usuarios.map(usuario => {
            const usuarioObj = usuario.toObject();
            if (usuarioObj.documentos?.imagen_perfil_url) {
                usuarioObj.documentos.imagen_perfil_url = buildImageUrl(req, usuarioObj.documentos.imagen_perfil_url);
            }
            if (usuarioObj.documentos?.imagen_ine_url) {
                usuarioObj.documentos.imagen_ine_url = buildImageUrl(req, usuarioObj.documentos.imagen_ine_url);
            }
            return usuarioObj;
        });

        // Opción para cifrar la respuesta (usar query param ?encrypt=true)
        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Usuarios obtenidos exitosamente',
        //         data: usuariosConUrls
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, usuariosConUrls, 'Usuarios obtenidos exitosamente');
    } catch (error) {
        console.error('Error en index usuarios:', error);
        return JsonResponse.error(res, 'Error al obtener usuarios', 500);
    }
};

/**
 * Obtener un usuario por ID. SHOW LOCAL 
 * GET /usuarios/:id
 * Acepta tanto ObjectId (_id) como usuario_id (número)
 */
exports.show = async (req, res) => {
    try {
        console.log('SHOW id, id_usuario de usuario solicitado:')
        let usuario;
        
        // Intentar buscar por ObjectId primero
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            usuario = await LocalUsuario.findById(req.params.id);
        }
        
        // Si no se encontró por ObjectId, intentar por usuario_id
        if (!usuario) {
            const usuarioIdNum = parseInt(req.params.id);
            if (!isNaN(usuarioIdNum)) {
                usuario = await LocalUsuario.findOne({ usuario_id: usuarioIdNum });
            }
        }

        // Validar que el usuario exista
        if (!usuario) {
            return JsonResponse.notFound(res, 'Usuario no encontrado');
        }

        // Construir URLs públicas para imágenes
        const usuarioObj = usuario.toObject();
        if (usuarioObj.documentos?.imagen_perfil_url) {
            usuarioObj.documentos.imagen_perfil_url = buildImageUrl(req, usuarioObj.documentos.imagen_perfil_url);
        }
        if (usuarioObj.documentos?.imagen_ine_url) {
            usuarioObj.documentos.imagen_ine_url = buildImageUrl(req, usuarioObj.documentos.imagen_ine_url);
        }

        // Opción para cifrar la respuesta
        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Usuario obtenido exitosamente',
        //         data: usuarioObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, usuarioObj, 'Usuario obtenido exitosamente');
    } catch (error) {
        console.error('Error en show usuario:', error);
        return JsonResponse.error(res, 'Error al obtener usuario', 500);
    }
};

/**
 * Crear un nuevo usuario STORE CON dualWriter
 * POST /usuarios
 */
exports.store = async (req, res) => {
    try {
        const {
            usuario_id,
            username,
            password,
            rol,
            nombre,
            apellido_paterno,
            apellido_materno,
            numero_casa,
            email,
            telefono,
            documentos,
            perfil_detalle
        } = req.body;

        // Verificar si el usuario_id ya existe
        const usuarioExistente = await LocalUsuario.findOne({ 
            $or: [
                { usuario_id },
                { username },
                { email }
            ]
        });

        if (usuarioExistente) {
            return JsonResponse.error(res, 'El usuario_id, username o email ya existe', 400);
        }

        // Manejar archivos subidos
        let documentosData = {};
        if (documentos) {
            try {
                documentosData = typeof documentos === 'string' ? JSON.parse(documentos) : documentos;
            } catch {
                documentosData = documentos;
            }
        }
        if (req.files) {
            if (req.files.imagen_perfil && req.files.imagen_perfil[0]) {
                documentosData.imagen_perfil_url = `uploads/usuarios/${req.files.imagen_perfil[0].filename}`;
            }
            if (req.files.imagen_ine && req.files.imagen_ine[0]) {
                documentosData.imagen_ine_url = `uploads/usuarios/${req.files.imagen_ine[0].filename}`;
            }
        }

        // Crear nuevo usuario
        const payload ={
            usuario_id,
            condominio_id: 'C500',
            username,
            password, // Se hasheará automáticamente en el pre-save hook
            rol,
            nombre,
            apellido_paterno,
            apellido_materno,
            numero_casa: numero_casa || '',
            email,
            telefono,
            documentos: documentosData,
            perfil_detalle: perfil_detalle ? (typeof perfil_detalle === 'string' ? JSON.parse(perfil_detalle) : perfil_detalle) : {}
        };

        // Usamos dualWriter para crear en local e intentar en Atlas (si falla, se encola)
        const nuevoUsuarioLocal = await usuarioDW.create(payload);
        const usuarioObj = nuevoUsuarioLocal.toObject();

        // Construir URLs públicas para imágenes si existen
        if (usuarioObj.documentos?.imagen_perfil_url) {
            usuarioObj.documentos.imagen_perfil_url = buildImageUrl(req, usuarioObj.documentos.imagen_perfil_url);
        }
        if (usuarioObj.documentos?.imagen_ine_url) {
            usuarioObj.documentos.imagen_ine_url = buildImageUrl(req, usuarioObj.documentos.imagen_ine_url);
        }

        // NOTA: El registro NO devuelve token según los requisitos
        return JsonResponse.success(res, usuarioObj, 'Usuario creado exitosamente', 201);
    } catch (error) {
        console.error('Error en store usuario:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El usuario_id, username o email ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear usuario', 500);
    }
};

/**
 * Actualizar un usuario UPDATE CON dualWriter
 * PUT /usuarios/:id
 * Acepta tanto ObjectId (_id) como usuario_id (número)
 */
exports.update = async (req, res) => {
    try {
        let usuario;
        
        // Intentar buscar por ObjectId primero
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            usuario = await LocalUsuario.findById(req.params.id);
        }
        
        // Si no se encontró por ObjectId, intentar por usuario_id
        if (!usuario) {
            const usuarioIdNum = parseInt(req.params.id);
            if (!isNaN(usuarioIdNum)) {
                usuario = await LocalUsuario.findOne({ usuario_id: usuarioIdNum });
            }
        }
        
        // Validar que el usuario exista
        if (!usuario) {
            return JsonResponse.notFound(res, 'Usuario no encontrado');
        }

        const {
            username,
            password,
            nombre,
            apellido_paterno,
            apellido_materno,
            numero_casa,
            email,
            telefono,
            documentos,
            perfil_detalle
        } = req.body;

        // Verificar si el username o email ya están en uso por otro usuario
        if (username || email) {
            const query = {
                $or: [
                    ...(username ? [{ username }] : []),
                    ...(email ? [{ email }] : [])
                ]
            };
            
            // Excluir el usuario actual (por _id o usuario_id)
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                query._id = { $ne: req.params.id };
            } else {
                const usuarioIdNum = parseInt(req.params.id);
                if (!isNaN(usuarioIdNum)) {
                    query.usuario_id = { $ne: usuarioIdNum };
                }
            }
            
            const usuarioExistente = await LocalUsuario.findOne(query);

            if (usuarioExistente) {
                return JsonResponse.error(res, 'El username o email ya está en uso', 400);
            }
        }

        // Manejar archivos subidos
        let documentosData = usuario.documentos || {};
        if (documentos) {
            try {
                documentosData = { ...documentosData, ...JSON.parse(documentos) };
            } catch {
                documentosData = { ...documentosData, ...documentos };
            }
        }
        if (req.files) {
            if (req.files.imagen_perfil && req.files.imagen_perfil[0]) {
                documentosData.imagen_perfil_url = `uploads/usuarios/${req.files.imagen_perfil[0].filename}`;
            }
            if (req.files.imagen_ine && req.files.imagen_ine[0]) {
                documentosData.imagen_ine_url = `uploads/usuarios/${req.files.imagen_ine[0].filename}`;
            }
        }

        //Armamos el objeto plano 'data' para DualWrite
        const data = {}; 
        // Actualizar campos
        if (username) data.username = username;
        if (password) data.password = password; // Se hasheará automáticamente
        if (nombre) data.nombre = nombre;
        if (apellido_paterno) data.apellido_paterno = apellido_paterno;
        if (apellido_materno) data.apellido_materno = apellido_materno;
        if (numero_casa !== undefined) data.numero_casa = numero_casa;
        if (email) data.email = email;
        if (telefono) data.telefono = telefono;
        
        data.documentos = documentosData;

        if (perfil_detalle) {
            try {
                data.perfil_detalle = { ...usuario.perfil_detalle, ...JSON.parse(perfil_detalle) };
            } catch {
                data.perfil_detalle = { ...usuario.perfil_detalle, ...perfil_detalle };
            }
        }

        //dualWrite
        const updated = await usuarioDW.update(usuario._id, data);
        const usuarioObj = updated.toObject();

        // Construir URLs públicas para imágenes
        if (usuarioObj.documentos?.imagen_perfil_url) {
            usuarioObj.documentos.imagen_perfil_url = buildImageUrl(req, usuarioObj.documentos.imagen_perfil_url);
        }
        if (usuarioObj.documentos?.imagen_ine_url) {
            usuarioObj.documentos.imagen_ine_url = buildImageUrl(req, usuarioObj.documentos.imagen_ine_url);
        }

        // Opción para cifrar la respuesta
        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Usuario actualizado exitosamente',
        //         data: usuarioObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, usuarioObj, 'Usuario actualizado exitosamente');
    } catch (error) {
        console.error('Error en update usuario:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El username o email ya está en uso', 400);
        }
        return JsonResponse.error(res, 'Error al actualizar usuario', 500);
    }
};

/**
 * Eliminar un usuario DESTROY CON DUALWRITE
 * DELETE /usuarios/:id
 * Acepta tanto ObjectId (_id) como usuario_id (número)
 */
exports.destroy = async (req, res) => {
    try {
        let usuario;
        
        //Modificamos el metodo de busqueda para poder aplicar DualWrite

        // Intentar buscar por ObjectId
        if (mongoose.Types.ObjectId.isValid(req.params.id)) 
            usuario = await LocalUsuario.findById(req.params.id);

        //Sino biscamos por usuario_id
        if (!usuario) {
            const idNum = parseInt(req.params.id);
            if (!isNaN(idNum))
                usuario = await LocalUsuario.findOne({ usuario_id: idNum});
        }
        
        // Validar que el usuario exista
        if (!usuario) {
            return JsonResponse.notFound(res, 'Usuario no encontrado');
        }

        // dualWrite
        await usuarioDW.delete(usuario._id);

        return JsonResponse.success(res, null, 'Usuario eliminado exitosamente');
    } catch (error) {
        console.error('Error en destroy usuario:', error);
        return JsonResponse.error(res, 'Error al eliminar usuario', 500);
    }
};

/**
 * Login de usuario
 * POST /usuarios/login
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar usuario por username
        const usuario = await Usuario.findOne({ username }).select('+password');
        
        if (!usuario) {
            return JsonResponse.error(res, 'Usuario no encontrado', 401);
        }

        // Verificar password
        const passwordValido = await usuario.comparePassword(password);
        if (!passwordValido) {
            return JsonResponse.error(res, 'Credenciales incorrectas', 401);
        }

        // Crear token JWT
        const payload = {
            usuario: {
                id: usuario._id.toString(),
                usuario_id: usuario.usuario_id,
                username: usuario.username,
                rol: usuario.rol,
                condominio_id: usuario.condominio_id
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret-key-change-in-production',
            { expiresIn: '8h' }
        );

        return JsonResponse.success(res, { token }, 'Login exitoso');
    } catch (error) {
        console.error('Error en login:', error);
        return JsonResponse.error(res, 'Error al iniciar sesión', 500);
    }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /usuarios/mi-perfil
 */
exports.miPerfil = async (req, res) => {
    try {
        // Obtener usuario_id del token JWT
        const usuario_id = req.usuario?.usuario_id;
        
        if (!usuario_id) {
            return JsonResponse.error(res, 'Usuario no identificado', 401);
        }

        // Buscar usuario por usuario_id
        const usuario = await Usuario.findOne({ usuario_id: Number(usuario_id) });

        if (!usuario) {
            return JsonResponse.notFound(res, 'Usuario no encontrado');
        }

        // Construir URLs públicas para imágenes
        const usuarioObj = usuario.toObject();
        if (usuarioObj.documentos?.imagen_perfil_url) {
            usuarioObj.documentos.imagen_perfil_url = buildImageUrl(req, usuarioObj.documentos.imagen_perfil_url);
        }
        if (usuarioObj.documentos?.imagen_ine_url) {
            usuarioObj.documentos.imagen_ine_url = buildImageUrl(req, usuarioObj.documentos.imagen_ine_url);
        }

        // Opción para cifrar la respuesta
        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Perfil obtenido exitosamente',
        //         data: usuarioObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, usuarioObj, 'Perfil obtenido exitosamente');
    } catch (error) {
        console.error('Error en miPerfil:', error);
        return JsonResponse.error(res, 'Error al obtener perfil', 500);
    }
};

/**
 * Logout de usuario (invalidar token)
 * POST /usuarios/logout
 */
exports.logout = async (req, res) => {
    try {
        // Obtener el token del header Authorization
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return JsonResponse.error(res, 'No se proporcionó token de autenticación', 401);
        }

        // Validar el formato del token (debe ser "Bearer <token>")
        const tokenParts = authHeader.split(' ');
        
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return JsonResponse.error(res, 'Formato de token no válido', 400);
        }

        const token = tokenParts[1];

        // Verificar que el token sea válido antes de invalidarlo
        try {
            jwt.verify(token, process.env.JWT_SECRET || 'secret-key-change-in-production');
        } catch (error) {
            // Si el token ya es inválido o expiró, aún así podemos confirmar el logout
            // pero no lo agregamos a la blacklist ya que no es necesario
            console.log('Token inválido o expirado en logout:', error.message);
            return JsonResponse.success(res, null, 'Sesión cerrada exitosamente (token ya no válido)');
        }

        // Agregar el token a la blacklist para invalidarlo
        const added = tokenBlacklist.add(token);
        
        if (!added) {
            console.error('Error al agregar token a blacklist');
            return JsonResponse.error(res, 'Error al cerrar sesión', 500);
        }

        return JsonResponse.success(res, null, 'Sesión cerrada exitosamente');
    } catch (error) {
        console.error('Error en logout:', error);
        return JsonResponse.error(res, 'Error al cerrar sesión', 500);
    }
};
