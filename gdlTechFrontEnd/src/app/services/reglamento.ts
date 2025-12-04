import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReglamentoService {
  // Prefijo de la API (DEBE SER SINGULAR: /reglamento)
  private apiUrl = `${environment.apiUrl}/reglamento`; 
  private http = inject(HttpClient);

  // 1. OBTENER el reglamento activo (Show)
  getReglamento(id: string): Observable<any> {
    // Esto evita que se quede la cadena "/ID/" o cualquier error de doble slash.
    return this.http.get<any>(`${this.apiUrl}/${id}`); 
  }
  
  // 2. ACTUALIZAR el reglamento (Edit)
  updateReglamento(id: string, data: any): Observable<any> {
    // PUT /reglamento/:id
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  
  // 3. OBTENER TODOS (index)
  getReglamentos(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}