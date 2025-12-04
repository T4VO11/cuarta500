# Instrucciones para Configurar Render

## Problema: "Could not read package.json"

Este error ocurre porque Render no encuentra el `package.json` en la ubicación esperada.

## Solución

### Opción 1: Configurar en el Dashboard de Render (Recomendado)

1. Ve a tu servicio en Render
2. Ve a **Settings** > **Build & Deploy**
3. Configura manualmente:
   - **Root Directory**: `gdlTechBackEnd` (o `cuarta500/gdlTechBackEnd` según tu estructura)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Opción 2: Usar render.yaml (si está en la raíz del repo)

Si tu repositorio tiene esta estructura:
```
tu-repo/
  gdlTechBackEnd/
    package.json
    index.js
  gdlTechFrontEnd/
  ...
  render.yaml  ← debe estar aquí
```

Entonces el `render.yaml` en la raíz funcionará con:
```yaml
rootDir: gdlTechBackEnd
```

### Opción 3: Si tu repo tiene estructura anidada

Si tu repositorio tiene esta estructura:
```
tu-repo/
  cuarta500/
    gdlTechBackEnd/
      package.json
      index.js
    gdlTechFrontEnd/
  ...
  render.yaml  ← debe estar aquí
```

Entonces usa:
```yaml
rootDir: cuarta500/gdlTechBackEnd
```

## Verificar la Estructura

1. En GitHub, ve a tu repositorio
2. Verifica dónde está el `package.json` del backend
3. La ruta relativa desde la raíz del repo es lo que va en `rootDir`

## Configuración Manual en Render (Más Confiable)

Si el `render.yaml` no funciona, configura manualmente:

1. **Root Directory**: 
   - Si `package.json` está en `gdlTechBackEnd/` → usa `gdlTechBackEnd`
   - Si `package.json` está en `cuarta500/gdlTechBackEnd/` → usa `cuarta500/gdlTechBackEnd`

2. **Build Command**: `npm install`

3. **Start Command**: `npm start`

4. **Environment Variables** (en Settings > Environment):
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `MONGODB_URI` = (tu URI de MongoDB Atlas)
   - `JWT_SECRET` = (tu secreto JWT)
   - `ENCRYPTION_KEY` = (tu clave de cifrado)

## Verificar que Funciona

Después de configurar, Render debería:
1. Encontrar el `package.json`
2. Ejecutar `npm install` exitosamente
3. Ejecutar `npm start` y el servidor debería iniciar

