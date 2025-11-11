# Diagnóstico del Error "Cannot POST /usuarios/registrar"

## Pasos para Diagnosticar

### 1. Verificar que el servidor esté corriendo

Abre una terminal y ejecuta:
```bash
npm run dev
```

**Deberías ver:**
```
Servidor corriendo en puerto 3000
API disponible en http://localhost:3000
MongoDB conectado exitosamente.
```

**Si ves errores:**
- Error de MongoDB: Verifica que MongoDB esté corriendo y que la URI en `.env` sea correcta
- Error de módulos: Ejecuta `npm install`

### 2. Verificar que el puerto esté libre

En otra terminal:
```bash
netstat -ano | findstr :3000
```

Si hay algo corriendo en el puerto 3000, detén ese proceso.

### 3. Probar la ruta raíz

En Postman o navegador:
```
GET http://localhost:3000/
```

**Deberías recibir:**
```json
{
  "estado": "exito",
  "mensaje": "Bienvenidos a GDLTech API",
  ...
}
```

### 4. Probar la ruta de registro

**En Postman:**
- Método: `POST`
- URL: `http://localhost:3000/usuarios/registrar`
- Headers: 
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "usuario_id": 1,
  "username": "admin",
  "password": "123456",
  "rol": "administrador",
  "nombre": "Admin",
  "apellido_paterno": "Sistema",
  "apellido_materno": "Principal",
  "email": "admin@example.com",
  "telefono": "1234567890"
}
```

### 5. Verificar errores en la consola

Si el servidor está corriendo, revisa la consola para ver si hay errores cuando haces la petición.

### 6. Verificar archivo .env

Asegúrate de que el archivo `.env` existe y tiene:
```
MONGODB_URI=mongodb://localhost:27017/gdltech
JWT_SECRET=mi-clave-secreta-jwt-super-segura-cambiar-en-produccion-123456789
ENCRYPTION_KEY=clave-de-cifrado-de-32-caracteres-minimo-12345678901234567890
PORT=3000
```

## Soluciones Comunes

### Si el servidor no inicia:
1. Verifica que MongoDB esté corriendo
2. Verifica que el archivo `.env` exista
3. Ejecuta `npm install` para asegurar que todas las dependencias estén instaladas

### Si el servidor inicia pero la ruta no funciona:
1. Verifica que estés usando `POST` (no GET)
2. Verifica que la URL sea exactamente: `http://localhost:3000/usuarios/registrar`
3. Verifica que el `Content-Type` sea `application/json`
4. Revisa la consola del servidor para ver errores

### Si ves errores de validación:
- Asegúrate de enviar todos los campos requeridos
- Verifica que los tipos de datos sean correctos (usuario_id debe ser número, etc.)

