import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReporteFinanzaService {
  private apiUrl = 'http://localhost:3000/reporteFinanzas'; 
  private http = inject(HttpClient);

  // 1. OBTENER TODOS (index)
  getReportes(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
  
  // 2. OBTENER UNO SOLO (show)
  getReporte(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // 3. CREAR o ACTUALIZAR (usa FormData para la imagen de evidencia)
  saveReporte(data: FormData, id?: string): Observable<any> {
    if (id) {
        // PUT /reporteFinanzas/:id
        return this.http.put<any>(`${this.apiUrl}/${id}`, data);
    } else {
        // POST /reporteFinanzas
        return this.http.post<any>(this.apiUrl, data);
    }
  }
  
  // 4. ELIMINAR (destroy)
  deleteReporte(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}