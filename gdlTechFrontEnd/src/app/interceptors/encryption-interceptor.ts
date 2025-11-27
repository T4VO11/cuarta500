import { Injectable } from '@angular/core';
import {HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CryptoService } from '../services/crypto';

@Injectable()
export class EncryptionInterceptor implements HttpInterceptor {

  constructor(private cryptoService: CryptoService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    
    // ANALISIS DE LA PETICIÓN
    
    // Condición 1: ¿Es un método que envía datos? (POST, PUT, PATCH)
    // (Los GET y DELETE usualmente no llevan cuerpo, o no deberían cifrarse así)
    const esMetodoConDatos = ['POST', 'PUT', 'PATCH'].includes(request.method);

    // Condición 2: ¿Tiene contenido el cuerpo?
    const tieneCuerpo = request.body !== null && request.body !== undefined;

    // Condición 3 (LA CLAVE DE TU DUDA): ¿Es una subida de archivos?
    // Si request.body es de tipo FormData, significa que lleva imágenes/archivos.
    // instanceof FormData devuelve 'true' si son archivos, 'false' si es JSON.
    const esSubidaDeArchivos = request.body instanceof FormData;

    // LÓGICA FINAL:
    // "Si envías datos, tienes cuerpo, Y NO ES UNA SUBIDA DE ARCHIVOS... entonces cifra."
    if (esMetodoConDatos && tieneCuerpo && !esSubidaDeArchivos) {
      
      console.log(`Cifrando datos salientes (${request.method})...`);
      
      // 1. Ciframos el cuerpo original
      const encryptedData = this.cryptoService.encrypt(request.body);
      
      // 2. Clonamos la petición (porque en Angular son inmutables)
      // Y reemplazamos el cuerpo original por el objeto { data: "..." }
      const clonedRequest = request.clone({
        body: { 
            data: encryptedData 
        }
      });

      // 3. Dejamos pasar la petición clonada y cifrada
      return next.handle(clonedRequest);
    }

    // Si era una imagen o un GET, dejamos pasar la petición original sin tocarla
    return next.handle(request);
  }
}