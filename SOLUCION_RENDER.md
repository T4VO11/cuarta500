# Solución al Error de Render

## Error Actual
```
Service Root Directory "/opt/render/project/src/cuarta500/gdlTechBackEnd" is missing.
```

## Causa
Render no encuentra el directorio `cuarta500/gdlTechBackEnd` en tu repositorio de GitHub.

## Solución: Verificar Estructura del Repositorio

### Paso 1: Verifica la estructura en GitHub

1. Ve a tu repositorio: https://github.com/T4VO11/cuarta500
2. Busca el archivo `package.json` del backend
3. Anota la ruta completa desde la raíz del repo

### Paso 2: Configuración según la estructura

**Opción A: Si la estructura es:**
```
cuarta500/ (repo root)
  cuarta500/
    gdlTechBackEnd/
      package.json
```
→ Usa en Render Dashboard: `Root Directory` = `cuarta500/gdlTechBackEnd`

**Opción B: Si la estructura es:**
```
cuarta500/ (repo root)
  gdlTechBackEnd/
    package.json
```
→ Usa en Render Dashboard: `Root Directory` = `gdlTechBackEnd`

**Opción C: Si la estructura es diferente:**
→ Usa la ruta relativa desde la raíz del repo hasta donde está `package.json`

### Paso 3: Configurar en Render Dashboard (MÁS CONFIABLE)

1. Ve a tu servicio en Render
2. **Settings** → **Build & Deploy**
3. En **Root Directory**, ingresa la ruta correcta:
   - Si `package.json` está en `cuarta500/gdlTechBackEnd/` → usa: `cuarta500/gdlTechBackEnd`
   - Si `package.json` está en `gdlTechBackEnd/` → usa: `gdlTechBackEnd`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Guarda y haz deploy nuevamente

### Paso 4: Verificar que funciona

Después del deploy, deberías ver:
- ✅ `npm install` ejecutándose correctamente
- ✅ `npm start` iniciando el servidor
- ✅ Sin errores de "missing directory"

## Nota sobre render.yaml

Si prefieres usar `render.yaml`, asegúrate de que:
1. Esté en la **raíz del repositorio** (no dentro de ninguna carpeta)
2. El `rootDir` coincida exactamente con la estructura de tu repo en GitHub
3. Si no funciona, usa la configuración manual en el dashboard (más confiable)

