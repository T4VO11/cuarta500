# Solución: Errores de Inicio - URL del Backend

## Problema
El frontend no puede conectarse al backend porque tiene hardcodeado `localhost:3000` en lugar de usar la URL del backend hosteado.

## Cambios Realizados

### 1. ✅ Actualizado `auth.ts`
- **Antes**: `private baseUrl = 'http://localhost:3000';`
- **Después**: `private baseUrl = environment.apiUrl;`
- Ahora usa la configuración del environment

### 2. ✅ Actualizado `environment.ts`
- **Antes**: `apiUrl: 'https://tu-backend.onrender.com'`
- **Después**: `apiUrl: 'https://cuarta500-backend.onrender.com'`
- URL actualizada con tu backend de Render

## Verificación

### Paso 1: Verificar URL del Backend
Asegúrate de que la URL en `environment.ts` coincida con tu servicio en Render:
- Ve a **Render Dashboard** → Tu servicio backend
- Copia la URL (debe ser algo como: `https://cuarta500-backend.onrender.com`)
- Si es diferente, actualiza `environment.ts`

### Paso 2: Verificar que el Backend Esté Funcionando
1. Abre en el navegador: `https://cuarta500-backend.onrender.com`
2. Deberías ver un JSON con el mensaje de bienvenida
3. Si no funciona, revisa los logs en Render

### Paso 3: Verificar CORS
El backend debe permitir requests desde Netlify. Verifica en `gdlTechBackEnd/index.js` que CORS esté configurado para producción.

### Paso 4: Rebuild y Deploy
Después de los cambios:
1. Haz commit y push
2. Netlify detectará los cambios y hará un nuevo deploy
3. El frontend ahora debería conectarse al backend correctamente

## Otros Servicios

Si hay otros servicios que también usan `localhost:3000`, actualízalos de la misma forma:
```typescript
import { environment } from '../../environments/environment';
private baseUrl = environment.apiUrl;
```

## Troubleshooting

### Error: "Network Error" o "Failed to fetch"
- **Causa**: El backend no está accesible o CORS bloquea la petición
- **Solución**: Verifica que el backend esté funcionando y que CORS permita tu dominio de Netlify

### Error: "404 Not Found"
- **Causa**: La URL del backend es incorrecta
- **Solución**: Verifica la URL en Render y actualiza `environment.ts`

### Error: "CORS policy"
- **Causa**: El backend no permite requests desde Netlify
- **Solución**: Actualiza CORS en `gdlTechBackEnd/index.js` para permitir `*.netlify.app`

