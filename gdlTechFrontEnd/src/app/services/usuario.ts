import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`; 
  private http = inject(HttpClient);

  // 1. OBTENER TODOS LOS USUARIOS (index)
  getUsuarios(): Observable<any> {
    // GET /usuarios (Ruta protegida por requireAdmin)
    return this.http.get<any>(this.apiUrl);
  }
  
  // 2. OBTENER UN SOLO USUARIO (show)
  getUsuario(id: string): Observable<any> {
    // GET /usuarios/:id (Ruta protegida por requireAdmin)
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // 3. BORRAR un Usuario
  deleteUsuario(id: string): Observable<any> {
    // DELETE /usuarios/:id (Ruta protegida por requireAdmin)
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 4. CREAR y ACTUALIZAR (Maneja FormData para imágenes)
  saveUsuario(data: FormData, id?: string): Observable<any> {
    if (id) {
      // PUT /usuarios/:id 
      return this.http.put(`${this.apiUrl}/${id}`, data);
    } else {
      // POST /usuarios/registrar (Si es para crear un usuario nuevo)
      return this.http.post(`${this.apiUrl}/registrar`, data); 
    }
  }
}