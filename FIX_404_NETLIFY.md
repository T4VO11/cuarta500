# Solución al Error 404 en Netlify

## Problema
El sitio se despliega pero muestra "Page not found" (404) al acceder.

## Causas Posibles

### 1. **Publish Directory Incorrecto**
Angular moderno puede generar el build en diferentes ubicaciones según la versión.

### 2. **Redirecciones No Funcionan**
Las redirecciones SPA no están configuradas correctamente.

## Soluciones

### Paso 1: Verificar el Output Path Real

1. Ve a **Netlify Dashboard** → Tu sitio → **Deploys**
2. Abre el último deploy exitoso
3. Ve a la pestaña **Files** o **Browse files**
4. Busca dónde está el `index.html`

**Ubicaciones posibles:**
- `dist/gdlTechFrontEnd/browser/index.html` (Angular 17+)
- `dist/gdlTechFrontEnd/index.html` (Angular anterior)
- `dist/browser/index.html` (si el proyecto no tiene nombre)
- `dist/index.html` (configuración antigua)

### Paso 2: Actualizar `netlify.toml`

Una vez que sepas dónde está el `index.html`, actualiza el `publish` en `netlify.toml`:

**Opción A: Si está en `dist/gdlTechFrontEnd/browser/`**
```toml
publish = "gdlTechFrontEnd/dist/gdlTechFrontEnd/browser"
```

**Opción B: Si está en `dist/gdlTechFrontEnd/`**
```toml
publish = "gdlTechFrontEnd/dist/gdlTechFrontEnd"
```

**Opción C: Si está en `dist/browser/`**
```toml
publish = "gdlTechFrontEnd/dist/browser"
```

### Paso 3: Verificar Redirecciones

El `netlify.toml` ya tiene:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

También creé `gdlTechFrontEnd/public/_redirects` como respaldo:
```
/*    /index.html   200
```

### Paso 4: Configurar en Netlify Dashboard (Alternativa)

Si el `netlify.toml` no funciona, configura manualmente:

1. **Site settings** → **Build & deploy** → **Build settings**
2. **Publish directory**: (usa el path que encontraste en el Paso 1)
   - Ejemplo: `gdlTechFrontEnd/dist/gdlTechFrontEnd/browser`
3. **Build command**: `cd gdlTechFrontEnd && npm install && npm run build`

### Paso 5: Verificar Build Logs

En los logs del deploy, busca:
- ✅ `Build succeeded`
- ✅ `Published directory: gdlTechFrontEnd/dist/...`
- ❌ Si ves errores, corrígelos primero

### Paso 6: Forzar Nuevo Deploy

Después de actualizar `netlify.toml`:
1. Haz commit y push
2. O ve a **Deploys** → **Trigger deploy** → **Deploy site**

## Verificación Rápida

Si después de actualizar el `publish` path sigue sin funcionar:

1. **Verifica que el build se complete**: Los logs deben mostrar "Build succeeded"
2. **Verifica que los archivos existan**: Usa "Browse files" en Netlify para ver qué se generó
3. **Prueba acceder directamente a `/index.html`**: Si funciona, el problema es solo las redirecciones
4. **Revisa la consola del navegador**: Puede haber errores de JavaScript que impidan cargar la app

## Nota sobre Angular Moderno

Angular 17+ con el nuevo builder (`@angular/build:application`) genera:
- Output: `dist/[project-name]/browser/`
- En tu caso: `dist/gdlTechFrontEnd/browser/`

Por eso el `publish` debe ser: `gdlTechFrontEnd/dist/gdlTechFrontEnd/browser`

