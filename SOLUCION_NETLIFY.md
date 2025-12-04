# Solución al Error de Netlify

## Error Actual
```
npm error path /opt/build/repo/package.json
npm error errno -2
npm error enoent Could not read package.json
```

## Causa
Netlify está buscando `package.json` en la raíz del repositorio, pero está en `gdlTechFrontEnd/`. Además, la configuración del dashboard está sobrescribiendo el `netlify.toml`.

## Solución

### Paso 1: Verificar que `netlify.toml` esté en la raíz
✅ Ya está creado en: `cuarta500/netlify.toml`

### Paso 2: Actualizar configuración en Netlify Dashboard

1. Ve a tu sitio en **Netlify Dashboard**
2. Ve a **Site settings** → **Build & deploy** → **Build settings**
3. **BORRA o ACTUALIZA** la configuración manual:

   **Opción A: Eliminar configuración manual (recomendado)**
   - Elimina el **Build command** del dashboard
   - Elimina el **Publish directory** del dashboard
   - Deja que Netlify use el `netlify.toml` automáticamente

   **Opción B: Actualizar configuración manual**
   - **Base directory**: `gdlTechFrontEnd` (o déjalo vacío)
   - **Build command**: `cd gdlTechFrontEnd && npm install && npm run build`
   - **Publish directory**: `gdlTechFrontEnd/dist/gdlTechFrontEnd`

### Paso 3: Verificar estructura del repositorio

Asegúrate de que en GitHub la estructura sea:
```
cuarta500/ (repo root)
  netlify.toml          ← Debe estar aquí
  render.yaml
  gdlTechFrontEnd/
    package.json        ← Aquí está el package.json
    angular.json
    src/
    ...
  gdlTechBackEnd/
    ...
```

### Paso 4: Hacer commit y push

```bash
git add netlify.toml
git commit -m "Fix: Mover netlify.toml a raíz del repositorio"
git push
```

### Paso 5: Trigger nuevo deploy

Netlify debería detectar el cambio automáticamente, o puedes:
- Ir a **Deploys** → **Trigger deploy** → **Deploy site**

## Configuración del `netlify.toml` (ya creado)

El archivo `netlify.toml` en la raíz tiene:
```toml
[build]
  command = "cd gdlTechFrontEnd && npm install && npm run build"
  publish = "gdlTechFrontEnd/dist/gdlTechFrontEnd"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Verificación

Después del deploy, deberías ver en los logs:
- ✅ `cd gdlTechFrontEnd && npm install` ejecutándose
- ✅ `npm run build` ejecutándose
- ✅ Build exitoso
- ✅ Sin errores de "package.json not found"

## Nota Importante

Si tienes configuración manual en el dashboard de Netlify, esa configuración **sobrescribe** el `netlify.toml`. Por eso es importante:
- **Opción 1**: Eliminar la configuración manual del dashboard (recomendado)
- **Opción 2**: Asegurarse de que la configuración manual coincida con el `netlify.toml`

