import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth'; 
import { Router } from '@angular/router';

// Guarda de activación (CanActivateFn) para proteger las rutas de administración.
// Si el usuario no está logueado (no hay token), lo redirige al login.
 
export const authGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // Token OK, permite el acceso.
  } else {
    alert('Acceso no autorizado. Inicia sesión primero para entrar al área de administración.');
    router.navigate(['/login/index']); // Redirige al login/index
    return false; // Bloquea la ruta.
  }
};
