import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

// 1. Agregamos 'withInterceptorsFromDi' y 'HTTP_INTERCEPTORS' a los imports
import { provideHttpClient, withInterceptors, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http'; 
import { routes } from './app.routes'; 

// Tus interceptores
import { tokenInterceptor } from './interceptors/token-interceptor';
import { DecryptionInterceptor } from './interceptors/decryption-interceptor'; // <--- Importamos el nuevo
import { EncryptionInterceptor } from './interceptors/encryption-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    
    provideHttpClient(
      // Mantenemos tu interceptor de token actual (funcional)
      withInterceptors([tokenInterceptor]),
      
      // Habilitamos el soporte para interceptores de clase (legacy)
      withInterceptorsFromDi() 
    ),

    {
        provide: HTTP_INTERCEPTORS,
        useClass: EncryptionInterceptor, // <--- Este cifra lo que SALE
        multi: true
    },

    // Registramos el nuevo interceptor de clase aquí abajo
    {
        provide: HTTP_INTERCEPTORS,
        useClass: DecryptionInterceptor,
        multi: true
    }
  ]
};