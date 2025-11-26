import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CryptoService } from '../services/crypto'; // Asegúrate que la ruta sea correcta

@Injectable()
export class DecryptionInterceptor implements HttpInterceptor {

  constructor(private cryptoService: CryptoService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        // Solo nos interesan las respuestas exitosas (HttpResponse)
        if (event instanceof HttpResponse) {
          const body = event.body;

          // LÓGICA DE DETECCIÓN:
          // 1. ¿Existe el cuerpo y tiene la propiedad data?
          // 2. ¿La propiedad 'data' es un STRING? (Si es objeto, no está cifrado)
          if (body && body.data && typeof body.data === 'string') {
            
            // Llamamos al servicio que creaste en el paso anterior
            const decryptedData = this.cryptoService.decrypt(body.data);

            if (decryptedData) {
              // Si se descifró con éxito, CLONAMOS la respuesta original
              // pero reemplazamos la data cifrada con la data limpia (JSON)
              const newBody = { 
                ...body, 
                data: decryptedData 
              };
              
              return event.clone({ body: newBody });
            }
          }
        }
        // Si no era una respuesta cifrada, o hubo error, pasamos el evento tal cual
        return event;
      })
    );
  }
}