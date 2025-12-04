# Guía de Hosting - Cuarta500

## Arquitectura de Hosting

### 1. Frontend Angular → Netlify ✅
- **Servicio**: Netlify
- **URL**: `https://tu-app.netlify.app`
- **Configuración**: Build automático desde GitHub

### 2. Backend Express → Render/Railway/Heroku ⚠️
- **Servicio**: Render, Railway, o Heroku (Netlify no soporta Node.js completo)
- **URL**: `https://tu-backend.onrender.com` (ejemplo)
- **Configuración**: Deploy desde GitHub o Docker

### 3. Apps Móviles → No se hostean
- **Ejecución**: Local en el dispositivo (celular/PC)
- **Configuración**: Deben apuntar a la URL del backend hosteado

## Pasos para Hostear

### Paso 1: Hostear Backend (Render - Recomendado)

1. **Crear cuenta en Render**: https://render.com
2. **Conectar repositorio** de GitHub
3. **Crear nuevo Web Service**:
   - Build Command: `npm install`
   - Start Command: `node index.js` o `npm start`
   - Environment Variables:
     - `MONGODB_URI`: Tu conexión a MongoDB Atlas
     - `JWT_SECRET`: Tu secreto JWT
     - `ENCRYPTION_KEY`: Tu clave de cifrado
     - `PORT`: 3000 (o el que uses)
4. **Obtener URL**: `https://tu-backend.onrender.com`

### Paso 2: Hostear Frontend Angular (Netlify)

1. **Crear cuenta en Netlify**: https://netlify.com
2. **Conectar repositorio** de GitHub
3. **Configurar build**:
   - Build command: `npm run build`
   - Publish directory: `dist/gdlTechFrontEnd`
4. **Configurar variables de entorno**:
   - `API_URL`: `https://tu-backend.onrender.com`
5. **Obtener URL**: `https://tu-app.netlify.app`

### Paso 3: Configurar Apps Móviles

Las apps móviles necesitan apuntar a la URL del backend hosteado.

**Opción A: Variable de entorno al ejecutar**
```bash
# Windows PowerShell
$env:API_BASE_URL="https://tu-backend.onrender.com"
python main.py

# Linux/Mac
export API_BASE_URL="https://tu-backend.onrender.com"
python main.py
```

**Opción B: Modificar directamente en el código**
Editar `api_client.py` y cambiar:
```python
BASE_URL = "https://tu-backend.onrender.com"
```

## Configuración de URLs

### Frontend Angular

**environment.ts** (producción):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend.onrender.com',
  secretKey: 'tu-clave-de-cifrado'
};
```

**environment.development.ts** (desarrollo):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  secretKey: 'tu-clave-de-cifrado'
};
```

### Apps Móviles

**Cuarta500Movil/api_client.py**:
```python
BASE_URL = os.getenv("API_BASE_URL", "https://tu-backend.onrender.com")
```

**Cuarta500Guardia/api_client.py**:
```python
BASE_URL = os.getenv("API_BASE_URL", "https://tu-backend.onrender.com")
```

## Consideraciones Importantes

### CORS
Asegúrate de que el backend tenga CORS configurado para permitir:
- `https://tu-app.netlify.app` (frontend)
- Orígenes de las apps móviles (si aplica)

### HTTPS
- Todos los servicios usan HTTPS en producción
- Las apps móviles deben usar `https://` no `http://`

### Variables de Entorno
- No subas archivos `.env` a GitHub
- Usa las variables de entorno del servicio de hosting

### MongoDB Atlas
- Asegúrate de que MongoDB Atlas permita conexiones desde las IPs de Render/Netlify
- O configura IP whitelist para permitir todas (0.0.0.0/0) en desarrollo

## Alternativas a Render

### Railway
- Similar a Render
- URL: `https://tu-backend.railway.app`

### Heroku
- Más costoso pero establecido
- URL: `https://tu-backend.herokuapp.com`

### Vercel
- Bueno para serverless
- URL: `https://tu-backend.vercel.app`

## Checklist de Deploy

- [ ] Backend hosteado y funcionando
- [ ] Frontend hosteado y funcionando
- [ ] CORS configurado correctamente
- [ ] Variables de entorno configuradas
- [ ] MongoDB Atlas accesible desde hosting
- [ ] Apps móviles apuntan a URL correcta
- [ ] HTTPS funcionando en todos los servicios
- [ ] Pruebas de conexión exitosas

