import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

// 1. Agregamos 'withInterceptorsFromDi' y 'HTTP_INTERCEPTORS' a los imports
import { provideHttpClient, withInterceptors, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http'; 
import { routes } from './app.routes'; 

// Tus interceptores
import { tokenInterceptor } from './interceptors/token-interceptor';
import { DecryptionInterceptor } from './interceptors/decryption-interceptor'; // <--- Importamos el nuevo

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    
    provideHttpClient(
      // Mantenemos tu interceptor de token actual (funcional)
      withInterceptors([tokenInterceptor]),
      
      // Habilitamos el soporte para interceptores de clase (legacy)
      withInterceptorsFromDi() 
    ),

    // Registramos el nuevo interceptor de clase aquí abajo
    {
        provide: HTTP_INTERCEPTORS,
        useClass: DecryptionInterceptor,
        multi: true
    }
  ]
};