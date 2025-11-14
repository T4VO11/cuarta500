# IntegradorMovil - App Móvil

App móvil desarrollada con Flet (Python) que consume las APIs del backend Express.

## Cambios Realizados

La app móvil ahora consume las APIs REST del backend en lugar de conectarse directamente a MongoDB.

## Configuración

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar URL del backend

Edita el archivo `api_client.py` y ajusta la variable `BASE_URL`:

```python
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
```

O configura la variable de entorno:
```bash
export API_BASE_URL=http://localhost:3000
```

**Nota importante:** Si ejecutas la app en un dispositivo móvil físico, necesitarás usar la IP de tu computadora en lugar de `localhost`. Por ejemplo:
- `http://192.168.1.100:3000` (reemplaza con tu IP local)

### 3. Asegurar que el backend esté corriendo

El backend debe estar ejecutándose en el puerto configurado (por defecto 3000).

## Estructura de Archivos

- `api_client.py` - Cliente HTTP para consumir las APIs del backend
- `token_storage.py` - Manejo de almacenamiento del token JWT
- `controller.py` - Controlador actualizado para usar el API client
- `model.py` - Modelo actualizado para usar el API client
- `login.py` - Pantalla de login actualizada
- `registro.py` - Pantalla de registro actualizada
- `home.py` - Pantalla principal actualizada

## Funcionalidades Implementadas

### Autenticación
- ✅ Login con username/password
- ✅ Registro de nuevos usuarios
- ✅ Almacenamiento persistente del token JWT
- ✅ Logout

### Usuarios
- ✅ Login y registro
- ✅ El token se guarda automáticamente para próximas sesiones

### Próximas funcionalidades
- Obtener datos del usuario actual
- Actualizar perfil
- Ver categorías, incidentes, etc.

## Uso

### Ejecutar la app

```bash
python main.py
```

### Flujo de autenticación

1. **Registro**: El usuario se registra y es redirigido al login
2. **Login**: El usuario inicia sesión y obtiene un token JWT
3. **Token guardado**: El token se guarda localmente para próximas sesiones
4. **Peticiones autenticadas**: Todas las peticiones incluyen el token en el header `Authorization: Bearer <token>`

## Notas Importantes

1. **CORS**: Asegúrate de que el backend tenga CORS configurado para permitir peticiones desde la app móvil.

2. **Token JWT**: El token se guarda en un archivo `token.json` en el directorio de la app. Este archivo contiene información sensible, considera agregarlo a `.gitignore`.

3. **Manejo de errores**: La app muestra mensajes de error cuando las peticiones fallan.

4. **Archivos**: Para subir archivos (imágenes de perfil, INE, etc.), necesitarás implementar el manejo de archivos en el registro/actualización.

## Próximos Pasos

- [ ] Implementar obtención de datos del usuario actual
- [ ] Implementar actualización de perfil
- [ ] Agregar funcionalidades para categorías, incidentes, etc.
- [ ] Mejorar manejo de archivos (imágenes)
- [ ] Agregar refresh token si el backend lo soporta
- [ ] Mejorar manejo de errores de red



