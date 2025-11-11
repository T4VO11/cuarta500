# Guía Completa de Postman - GDLTech API

## 1. Configuración Inicial de Postman

### Crear una Nueva Colección
1. Abre Postman
2. Click en "New" → "Collection"
3. Nombre: "GDLTech API"
4. Click en "Create"

### Configurar Variables de Entorno
1. Click en el ícono de "Environments" (ojo) en la barra lateral izquierda
2. Click en "+" para crear un nuevo environment
3. Nombre: "GDLTech Local"
4. Agrega estas variables:
   - `base_url` = `http://localhost:3000`
   - `token` = (déjalo vacío por ahora, se llenará después del login)
5. Click en "Save"
6. Selecciona este environment en el dropdown superior derecho

---

## 2. Probar que el Servidor Funciona

### GET - Ruta Raíz
1. Click en "New" → "HTTP Request"
2. Método: `GET`
3. URL: `{{base_url}}/` o `http://localhost:3000/`
4. Click en "Send"

**Resultado Esperado:**
```json
{
  "estado": "exito",
  "mensaje": "Bienvenidos a GDLTech API",
  "data": {
    "version": "1.0.0",
    "endpoints": {...}
  }
}
```

---

## 3. Registrar un Usuario (SIN TOKEN)

### POST - Registrar Usuario
1. En la colección "GDLTech API", crea una carpeta "Autenticación"
2. Dentro, crea un nuevo request: "Registrar Usuario"
3. Método: `POST`
4. URL: `{{base_url}}/usuarios/registrar`
5. Pestaña "Headers":
   - Key: `Content-Type`
   - Value: `application/json`
6. Pestaña "Body":
   - Selecciona "raw"
   - Dropdown: "JSON"
   - Pega este JSON:
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
7. Click en "Send"

**Resultado Esperado:**
```json
{
  "estado": "exito",
  "mensaje": "Usuario creado exitosamente",
  "data": {
    "_id": "...",
    "usuario_id": 1,
    "username": "admin",
    ...
  }
}
```

**⚠️ IMPORTANTE:** Este endpoint NO devuelve token.

---

## 4. Login (Obtener Token)

### POST - Login
1. En la carpeta "Autenticación", crea: "Login"
2. Método: `POST`
3. URL: `{{base_url}}/usuarios/login`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "username": "admin",
  "password": "123456"
}
```
6. Click en "Send"

**Resultado Esperado:**
```json
{
  "estado": "exito",
  "mensaje": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Guardar el Token
1. En la respuesta, copia el valor de `data.token`
2. Ve a "Environments" → "GDLTech Local"
3. En la variable `token`, pega el token copiado
4. Click en "Save"

---

## 5. Configurar Autenticación Automática

### Para TODOS los requests que requieren token:
1. Ve a la pestaña "Authorization"
2. Type: "Bearer Token"
3. Token: `{{token}}`
4. Esto usará automáticamente la variable `token` del environment

---

## 6. CRUD de Usuarios (CON TOKEN)

### Crear Carpeta "Usuarios"
En la colección, crea una carpeta "Usuarios"

### GET - Listar Usuarios (Index)
1. Request: "GET - Listar Usuarios"
2. Método: `GET`
3. URL: `{{base_url}}/usuarios`
4. Authorization: Bearer Token `{{token}}`
5. Send

**Resultado:** Lista de todos los usuarios

### GET - Obtener Usuario por ID (Show)
1. Request: "GET - Obtener Usuario"
2. Método: `GET`
3. URL: `{{base_url}}/usuarios/:id`
   - Puedes usar el **ObjectId de MongoDB** (ej: `{{base_url}}/usuarios/507f1f77bcf86cd799439011`)
   - O el **usuario_id numérico** (ej: `{{base_url}}/usuarios/1`)
4. Authorization: Bearer Token `{{token}}`
5. Send

**Resultado:** Datos del usuario específico

**⚠️ NOTA:** El sistema acepta ambos tipos de ID:
- **ObjectId de MongoDB** (ej: `507f1f77bcf86cd799439011`)
- **usuario_id numérico** (ej: `1`, `2`, `3`)

### PUT - Actualizar Usuario (Update)
1. Request: "PUT - Actualizar Usuario"
2. Método: `PUT`
3. URL: `{{base_url}}/usuarios/:id`
   - Puedes usar el **ObjectId de MongoDB** (ej: `{{base_url}}/usuarios/507f1f77bcf86cd799439011`)
   - O el **usuario_id numérico** (ej: `{{base_url}}/usuarios/1`)
4. Authorization: Bearer Token `{{token}}`
5. Headers: `Content-Type: application/json`
6. Body (raw JSON):
```json
{
  "nombre": "Admin Actualizado",
  "telefono": "9999999999"
}
```
7. Send

**Resultado:** Usuario actualizado

**⚠️ NOTA:** El sistema acepta ambos tipos de ID:
- **ObjectId de MongoDB** (ej: `507f1f77bcf86cd799439011`)
- **usuario_id numérico** (ej: `1`, `2`, `3`)

### DELETE - Eliminar Usuario (Destroy)
1. Request: "DELETE - Eliminar Usuario"
2. Método: `DELETE`
3. URL: `{{base_url}}/usuarios/:id`
   - Puedes usar el **ObjectId de MongoDB** (ej: `{{base_url}}/usuarios/507f1f77bcf86cd799439011`)
   - O el **usuario_id numérico** (ej: `{{base_url}}/usuarios/1`)
4. Authorization: Bearer Token `{{token}}`
5. Send

**Resultado:** Mensaje de éxito

**⚠️ NOTA:** El sistema acepta ambos tipos de ID:
- **ObjectId de MongoDB** (ej: `507f1f77bcf86cd799439011`)
- **usuario_id numérico** (ej: `1`, `2`, `3`)

---

## 7. CRUD de Categorías (CON TOKEN)

### Crear Carpeta "Categorías"

### GET - Listar Categorías
- Método: `GET`
- URL: `{{base_url}}/categorias`
- Authorization: Bearer Token `{{token}}`

### POST - Crear Categoría
- Método: `POST`
- URL: `{{base_url}}/categorias`
- Authorization: Bearer Token `{{token}}`
- Body:
```json
{
  "categoria_id": 1,
  "nombre": "Categoría Test",
  "descripcion": "Descripción",
  "estado": "activo"
}
```

---

## 8. Probar Validaciones

### Intentar Crear Usuario con Datos Inválidos
1. POST `{{base_url}}/usuarios/registrar`
2. Body con datos inválidos:
```json
{
  "usuario_id": 1,
  "username": "",  // Vacío - debe fallar
  "password": "123",  // Muy corto - debe fallar
  "email": "email-invalido"  // Formato inválido - debe fallar
}
```

**Resultado Esperado:**
```json
{
  "estado": "error",
  "mensaje": "Error de validación",
  "data": {
    "errores": [
      {
        "campo": "username",
        "mensaje": "El username es obligatorio",
        "valor": ""
      },
      ...
    ]
  }
}
```

---

## 9. Probar Sin Token (Debe Fallar)

### Intentar GET Usuarios sin Token
1. Request: "GET - Usuarios (SIN TOKEN)"
2. Método: `GET`
3. URL: `{{base_url}}/usuarios`
4. **NO agregues Authorization**
5. Send

**Resultado Esperado:**
```json
{
  "estado": "error",
  "mensaje": "No hay token, permiso no válido",
  "data": null
}
```

---

## 10. Probar Cifrado

### GET Usuarios SIN Cifrado
1. GET `{{base_url}}/usuarios`
2. Authorization: Bearer Token `{{token}}`
3. Send

**Resultado:** JSON normal con datos visibles

### GET Usuarios CON Cifrado
1. GET `{{base_url}}/usuarios?encrypt=true`
2. Authorization: Bearer Token `{{token}}`
3. Send

**Resultado:** JSON con datos cifrados en el campo `data`

---

## 11. Probar Subida de Archivos

### POST Usuario con Imagen
1. POST `{{base_url}}/usuarios/registrar`
2. **NO uses "raw" JSON**
3. Selecciona "Body" → "form-data"
4. Agrega los campos:
   - `usuario_id`: `1`
   - `username`: `test_user`
   - `password`: `123456`
   - `rol`: `habitante`
   - `nombre`: `Test`
   - `apellido_paterno`: `User`
   - `apellido_materno`: `Example`
   - `email`: `test@example.com`
   - `telefono`: `1234567890`
   - `imagen_perfil`: (Selecciona "File" y elige una imagen)
   - `imagen_ine`: (Selecciona "File" y elige una imagen)
5. Send

**Resultado:** Usuario creado con URLs públicas de las imágenes

---

## 12. Probar Logout

### POST - Logout
1. POST `{{base_url}}/usuarios/logout`
2. Authorization: Bearer Token `{{token}}`
3. Send

**Resultado:** Mensaje de éxito

---

## 13. Estructura Recomendada en Postman

```
GDLTech API/
├── Autenticación/
│   ├── Registrar Usuario
│   ├── Login
│   └── Logout
├── Usuarios/
│   ├── GET - Listar Usuarios
│   ├── GET - Obtener Usuario
│   ├── POST - Crear Usuario
│   ├── PUT - Actualizar Usuario
│   └── DELETE - Eliminar Usuario
├── Productos/
│   ├── GET - Listar Productos
│   ├── GET - Obtener Producto
│   ├── POST - Crear Producto
│   ├── PUT - Actualizar Producto
│   └── DELETE - Eliminar Producto
├── Proveedores/
│   └── [CRUD completo]
├── Categorías/
│   └── [CRUD completo]
├── Amenidades/
│   └── [CRUD completo]
├── Bitácoras/
│   └── [CRUD completo]
├── Incidentes/
│   └── [CRUD completo]
├── Invitar Amigos/
│   └── [CRUD completo]
├── Listado Adeudos/
│   └── [CRUD completo]
├── Reglamentos/
│   └── [CRUD completo]
├── Reporte Finanzas/
│   └── [CRUD completo]
└── Reservaciones/
    └── [CRUD completo]
```

---

## 14. Tips y Trucos

### Usar Variables en URLs
- En lugar de escribir el ID manualmente, usa: `{{base_url}}/usuarios/{{usuario_id}}`
- Crea variables para IDs que uses frecuentemente

### Guardar Respuestas como Ejemplos
1. Después de hacer un request exitoso
2. Click en "Save Response" → "Save as Example"
3. Útil para documentación

### Tests Automáticos
En la pestaña "Tests", puedes agregar código JavaScript:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has estado", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('estado');
});
```

### Pre-request Scripts
Para actualizar el token automáticamente después del login:
1. En el request "Login"
2. Pestaña "Tests"
3. Agrega:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
        console.log("Token guardado automáticamente");
    }
}
```

---

## 15. Ejemplos de Datos para Probar

### Usuario Administrador
```json
{
  "usuario_id": 1,
  "username": "super_admin",
  "password": "123456",
  "rol": "administrador",
  "nombre": "Mariela",
  "apellido_paterno": "Fernandez",
  "apellido_materno": "Soto",
  "numero_casa": "13",
  "email": "mariela.f@gmail.com",
  "telefono": "3347778899",
  "documentos": {
    "imagen_perfil_url": "",
    "imagen_ine_url": ""
  },
  "perfil_detalle": {
    "rfc": "FDSM850101XYZ",
    "nss": "12345678901"
  }
}
```

### Usuario Dueño
```json
{
  "usuario_id": 2,
  "username": "carlos_dueño",
  "password": "123456",
  "rol": "dueño",
  "nombre": "Carlos",
  "apellido_paterno": "Vargas",
  "apellido_materno": "Meza",
  "numero_casa": "20",
  "email": "carlos.v@gmail.com",
  "telefono": "3325446331",
  "documentos": {
    "imagen_perfil_url": "",
    "imagen_ine_url": ""
  },
  "perfil_detalle": {
    "rfc": "VMMC781212ABC",
    "nss": "98765432109",
    "auto": {
      "modelo": "Toyota Corolla",
      "color": "Gris",
      "placas": "TJX-8999"
    }
  }
}
```

---

## 16. Checklist de Pruebas

- [ ] Servidor responde en GET `/`
- [ ] Registrar usuario funciona (sin token)
- [ ] Login genera token
- [ ] Token se guarda en variables
- [ ] GET usuarios funciona CON token
- [ ] GET usuarios FALLA sin token
- [ ] Validaciones funcionan
- [ ] Cifrado funciona con `?encrypt=true`
- [ ] Subida de archivos funciona
- [ ] Logout funciona
- [ ] Todos los CRUD funcionan con token

---

