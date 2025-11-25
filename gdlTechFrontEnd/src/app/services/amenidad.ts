import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AmenidadService {
  private apiUrl = 'http://localhost:3000/amenidades'; // Ruta base de Express
  
  constructor(private http: HttpClient) { }

  // 1. OBTENER TODAS (Para mostrar la tabla)
  getAmenidades(): Observable<any> {
    // GET /amenidades (Ruta protegida por requireAdmin [cite: 2985])
    return this.http.get<any>(this.apiUrl); 
    // Back-End regresa { estado: 'exito', data: [...] }
  }

  // 2. BORRAR una Amenidad
  deleteAmenidad(id: string): Observable<any> {
    // DELETE /amenidades/:id (Ruta protegida por requireAdmin [cite: 2989])
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 3. CREAR y ACTUALIZAR (Incluye Subida de Archivos)
  // Nota: Tu Express espera los datos JSON y los archivos ('galeria') como multipart/form-data.
  // La ruta POST/PUT usa upload.array('galeria', 10)[cite: 2987, 2988].

  saveAmenidad(data: FormData, id?: string): Observable<any> {
    if (id) {
for (const [key, value] of data.entries()) {
        
        // El 'value' puede ser una cadena o un objeto File
        if (value instanceof File) {
            // Si es un archivo, imprimimos su información
            console.log(`[FILE] Clave: ${key}, Nombre: ${value.name}, Tipo: ${value.type}, Tamaño: ${value.size} bytes`);
        } else {
            // Si es un campo de texto (incluyendo JSON stringificados)
            console.log(`[TEXT] Clave: ${key}, Valor: ${value}`);
        }
    }
      // PUT /amenidades/:id
      return this.http.put(`${this.apiUrl}/${id}`, data);
    } else {
      for (const [key, value] of data.entries()) {
        
        // El 'value' puede ser una cadena o un objeto File
        if (value instanceof File) {
            // Si es un archivo, imprimimos su información
            console.log(`[FILE] Clave: ${key}, Nombre: ${value.name}, Tipo: ${value.type}, Tamaño: ${value.size} bytes`);
        } else {
            // Si es un campo de texto (incluyendo JSON stringificados)
            console.log(`[TEXT] Clave: ${key}, Valor: ${value}`);
        }
    }
      // POST /amenidades
      return this.http.post(this.apiUrl, data);
    }
    // IMPORTANTE: Cuando envías FormData, Angular lo maneja como multipart/form-data.
    // Los campos de texto (nombre, descripcion, etc.) deben ir anexados al FormData.
  }

  showAmenidad(id: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/${id}`);
}

}