# Debug: Problema de Login con Cifrado

## Problema
Al hacer clic en "Iniciar Sesión", muestra "Credenciales inválidas" y no funciona.

## Cambios Realizados

### ✅ 1. Corregido `crypto.ts`
- **Antes**: `import { environment } from '../../environments/environment.development';`
- **Después**: `import { environment } from '../../environments/environment';`
- Ahora usa la clave de producción correcta

## Verificaciones Necesarias

### 1. Verificar Clave de Cifrado

**Frontend** (`gdlTechFrontEnd/src/environments/environment.ts`):
```typescript
secretKey: 'clave-de-cifrado-de-32-caracteres-minimo-12345678901234567890'
```

**Backend** (Variable de entorno en Render):
- Ve a **Render Dashboard** → Tu servicio → **Environment**
- Verifica que `ENCRYPTION_KEY` tenga exactamente el mismo valor
- Debe ser: `clave-de-cifrado-de-32-caracteres-minimo-12345678901234567890`

### 2. Verificar Consola del Navegador

Abre las **DevTools** (F12) → **Console** y busca:

**Errores posibles:**
- `Error cifrando datos:` → Problema con el interceptor de cifrado
- `Error crítico al descifrar datos:` → Problema con el descifrado de respuesta
- `CORS policy` → Problema de CORS
- `Network Error` → El backend no está accesible

**Logs esperados:**
- `Cifrando datos salientes (POST)...` → El interceptor está funcionando

### 3. Verificar Network Tab

En **DevTools** → **Network**:
1. Haz clic en "Iniciar Sesión"
2. Busca la petición a `/usuarios/login`
3. Revisa:
   - **Request Payload**: Debe ser `{ "data": "IV_HEX:DATA_HEX" }` (cifrado)
   - **Response**: Debe tener `{ "estado": "exito", "data": {...} }` o `{ "estado": "error", ... }`

### 4. Verificar Logs del Backend

En **Render Dashboard** → **Logs**, busca:
- `Recibiendo datos cifrados, descifrando...` → El middleware está funcionando
- `Error descifrando petición entrante:` → Problema con la clave de cifrado
- `Usuario no encontrado` o `Credenciales incorrectas` → Problema con las credenciales

## Solución Paso a Paso

### Paso 1: Verificar Claves Coinciden

1. **Frontend**: Abre `gdlTechFrontEnd/src/environments/environment.ts`
2. **Backend**: Ve a Render → Environment → `ENCRYPTION_KEY`
3. **Deben ser IDÉNTICAS** (mismo string, mismo orden)

### Paso 2: Verificar URL del Backend

1. **Frontend**: `environment.ts` → `apiUrl: 'https://cuarta500-backend.onrender.com'`
2. **Verifica en Render**: Que la URL sea exactamente esa (puede variar)

### Paso 3: Probar sin Cifrado (Temporal)

Para debug, puedes desactivar temporalmente el cifrado:

**En `encryption-interceptor.ts`**, comenta el cifrado:
```typescript
intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // TEMPORAL: Desactivar cifrado para debug
    return next.handle(request);
    
    // Código original comentado...
}
```

Si funciona sin cifrado, el problema es el cifrado. Si no funciona, el problema es otro.

### Paso 4: Verificar Interceptores

En `app.config.ts`, los interceptores deben estar en este orden:
1. `EncryptionInterceptor` (cifra salida)
2. `DecryptionInterceptor` (descifra entrada)
3. `tokenInterceptor` (agrega token)

## Errores Comunes

### Error: "Datos corruptos o ilegibles"
- **Causa**: Las claves de cifrado no coinciden
- **Solución**: Verifica que `ENCRYPTION_KEY` en Render sea igual a `secretKey` en `environment.ts`

### Error: "Usuario no encontrado" (aunque el usuario existe)
- **Causa**: El descifrado falló, el backend recibe datos corruptos
- **Solución**: Verifica las claves de cifrado

### Error: CORS
- **Causa**: El backend no permite requests desde Netlify
- **Solución**: Verifica CORS en `gdlTechBackEnd/index.js` (ya debería estar configurado)

## Próximos Pasos

1. ✅ Verifica que las claves coincidan
2. ✅ Revisa la consola del navegador para errores
3. ✅ Revisa los logs de Render
4. ✅ Prueba hacer login y revisa la petición en Network tab
5. Si sigue sin funcionar, comparte los errores específicos que ves

