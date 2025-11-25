import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth'; // Asegúrate de que la ruta sea correcta


//Interceptor para inyectar el Token JWT en la cabecera de autorización 
 //en cada petición HTTP (excepto la de login).

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  
  // Inyecta el AuthService para obtener el token
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si hay token guardado en el navegador
  if (token) {
    // Clona la petición original para poder modificarla (es inmutable)
    const cloned = req.clone({
      setHeaders: {
        // Establece la cabecera en el formato que espera el Back-End
        // JWT estándar: "Bearer <token>"
        Authorization: `Bearer ${token}` 
      }
    });
    // envia la petición CLONADA y modificada al siguiente manejador
    return next(cloned);
  }

  // Si no hay token (ej. la petición de login), 
  // la petición original pasa sin el header de autorización.
  return next(req);
};
