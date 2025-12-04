import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class AdeudoService {
  // SOLUCIÓN: Declaramos 'apiUrl' como una propiedad privada de la clase.
  // Esto hace que TypeScript la reconozca.
  private apiUrl = `${environment.apiUrl}/listadoAdeudos`; // URL base de tu API
  
  // Usamos inject() para el HttpClient (inyección moderna)
  private http = inject(HttpClient); 

  // 1. LEER (Obtener todos los pagos)
  getAdeudos(): Observable<any> {
    // GET /listadoAdeudos
    return this.http.get(this.apiUrl);
  }

  // 2. CREAR (Simular un pago de mantenimiento)
  createPago(pagoData: any): Observable<any> {
    // POST /listadoAdeudos
    return this.http.post(this.apiUrl, pagoData);
  }

  iniciarPagoMantenimiento(data: any): Observable<any> {
    // Asegúrate de apuntar a tu nueva ruta
    return this.http.post(`${this.apiUrl}/crear-pago-mantenimiento`, data);
}
}