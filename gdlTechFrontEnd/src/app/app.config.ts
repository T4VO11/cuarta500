import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { routes } from './app.routes'; 
import { tokenInterceptor } from './interceptors/token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    
    // Registra el cliente HTTP y enlaza el Interceptor 
    provideHttpClient(
      withInterceptors([tokenInterceptor]) 
    ),
  ]
};