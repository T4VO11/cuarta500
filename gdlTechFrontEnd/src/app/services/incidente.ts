import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IncidenteService {
  private apiUrl = 'http://localhost:3000/incidentes'; 
  private http = inject(HttpClient);

  // 1. OBTENER TODOS (index)
  getIncidentes(): Observable<any> {
    // GET /incidentes
    return this.http.get<any>(this.apiUrl);
  }
  
  // 2. OBTENER UNO SOLO (show)
  getIncidente(id: string): Observable<any> {
    // GET /incidentes/:id
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // 3. CREAR un nuevo incidente (store)
  // Nota: Incidentes no usa archivos, solo JSON.
  createIncidente(data: any): Observable<any> {
    // POST /incidentes
    return this.http.post<any>(this.apiUrl, data);
  }
  
  // 4. ACTUALIZAR un incidente (update)
  updateIncidente(id: string, data: any): Observable<any> {
    // PUT /incidentes/:id
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  
  // 5. ELIMINAR un incidente (destroy)
  deleteIncidente(id: string): Observable<any> {
    // DELETE /incidentes/:id
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}