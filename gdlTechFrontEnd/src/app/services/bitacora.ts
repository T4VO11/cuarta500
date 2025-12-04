import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {
  // Ruta base del módulo de Bitácoras
  private apiUrl = `${environment.apiUrl}/bitacoras`; 
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
  
  createBitacora(data: any): Observable<any> {
    // POST /bitacoras
    return this.http.post<any>(this.apiUrl, data);
  }

  // Los métodos update, y delete no son necesarios para este módulo de solo lectura y crear.
}