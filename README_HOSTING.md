# Guía de Hosting - Cuarta500

## Estructura del Proyecto

```
cuarta500/
├── gdlTechBackEnd/      # Backend Express → Render/Railway
├── gdlTechFrontEnd/     # Frontend Angular → Netlify
├── Cuarta500Movil/      # App móvil (no se hostea)
└── Cuarta500Guardia/    # App guardia (no se hostea)
```

## ✅ NO HAY CONFLICTOS

Cada servicio tiene su propia configuración que especifica:
- **Netlify** (`netlify.toml`): Apunta a `gdlTechFrontEnd/`
- **Render** (`render.yaml`): Apunta a `gdlTechBackEnd/`
- **Apps móviles**: No se hostean, solo se ejecutan localmente

## Pasos para Hostear

### 1. Backend en Render

1. Sube tu repositorio completo a GitHub
2. En Render, crea un nuevo **Web Service**
3. Conecta tu repositorio de GitHub
4. Render detectará automáticamente el `render.yaml` en `gdlTechBackEnd/`
5. O configura manualmente:
   - **Root Directory**: `gdlTechBackEnd`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Agrega variables de entorno en el dashboard de Render
7. Obtén tu URL: `https://tu-backend.onrender.com`

### 2. Frontend en Netlify

1. En Netlify, crea un nuevo **Site**
2. Conecta tu repositorio de GitHub
3. Netlify detectará automáticamente el `netlify.toml` en `gdlTechFrontEnd/`
4. O configura manualmente:
   - **Base directory**: `gdlTechFrontEnd`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `gdlTechFrontEnd/dist/gdlTechFrontEnd`
5. Agrega variable de entorno:
   - `API_URL`: `https://tu-backend.onrender.com`
6. Obtén tu URL: `https://tu-app.netlify.app`

### 3. Apps Móviles

**NO se hostean**, pero necesitan apuntar al backend hosteado:

**Cuarta500Movil/api_client.py:**
```python
BASE_URL = os.getenv("API_BASE_URL", "https://tu-backend.onrender.com")
```

**Cuarta500Guardia/api_client.py:**
```python
BASE_URL = os.getenv("API_BASE_URL", "https://tu-backend.onrender.com")
```

## Configuración de URLs

### Frontend Angular

**gdlTechFrontEnd/src/environments/environment.ts:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend.onrender.com',
  secretKey: 'tu-clave-de-cifrado'
};
```

### Apps Móviles

Cambiar `BASE_URL` en ambos `api_client.py` o usar variable de entorno:
```bash
export API_BASE_URL="https://tu-backend.onrender.com"
```

## Verificaciones

- ✅ Cada servicio tiene su carpeta separada
- ✅ Archivos de configuración apuntan a las carpetas correctas
- ✅ No hay conflictos entre servicios
- ✅ Las apps móviles apuntan al backend hosteado

## Notas Importantes

1. **CORS**: Configura CORS en el backend para permitir:
   - `https://tu-app.netlify.app`
   - Orígenes de las apps móviles

2. **Variables de Entorno**: No subas `.env` a GitHub, úsalas en los dashboards

3. **MongoDB Atlas**: Asegúrate de permitir conexiones desde las IPs de Render

4. **HTTPS**: Todos los servicios usan HTTPS en producción

