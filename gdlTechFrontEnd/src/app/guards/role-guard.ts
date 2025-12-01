import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth'; 

export const roleGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Obtenemos el rol que REQUIERE la ruta (lo pondremos en el archivo de rutas)
  const expectedRoles = route.data['roles'] as Array<string>;

  // 2. Obtenemos el rol REAL del usuario desde el token
  const userRole = authService.getRole();

  // 3. Validación
  if (userRole && expectedRoles.includes(userRole)) {
    return true; // ¡Pase usted!
  }

  // 4. Si falla, decidimos a dónde mandarlo según quién sea
  if (userRole === 'administrador') {
     router.navigate(['/dashboard-admin']); // O tu ruta de admin
  } else if (userRole === 'guardia') {
     router.navigate(['/panel-guardia']);   // O tu ruta de guardia
  } else if (userRole === 'residente') {
     router.navigate(['/home-residente']);
  } else {
     // Si no tiene rol o token válido, al login
     router.navigate(['/login/index']);
  }
  
  return false; // Bloqueamos el acceso a la ruta original
};