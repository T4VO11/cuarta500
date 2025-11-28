import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {
  // Ruta base del módulo de Bitácoras
  private apiUrl = 'http://localhost:3000/bitacoras'; 
  private http = inject(HttpClient);

  // 1. OBTENER TODAS las bitácoras (index)
  getBitacoras(): Observable<any> {
    // GET /bitacoras (Ruta protegida por requireAdmin)
    return this.http.get<any>(this.apiUrl);
  }
  
  // 2. OBTENER UNA SOLA por ID (show)
  getBitacora(id: string): Observable<any> {
    // GET /bitacoras/:id
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  
  // Los métodos create, update, y delete no son necesarios para este módulo de solo lectura.
}