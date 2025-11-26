import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservacionService {
  private apiUrl = 'http://localhost:3000/reservaciones'; 
  private http = inject(HttpClient);

  // OBTENER TODAS las reservaciones (index)
  getReservaciones(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
  
  // CREAR una nueva reservación (Store)
  // Nota: Reservaciones no lleva archivos, solo datos JSON.
  createReservacion(data: any): Observable<any> {
    // POST /reservaciones
    return this.http.post<any>(this.apiUrl, data);
  }

  // OBTENER UNA SOLA (show)
  getReservacion(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // ACTUALIZAR una reservación (Update)
  updateReservacion(id: string, data: any): Observable<any> {
    // PUT /reservaciones/:id (No usa FormData, solo JSON)
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  //  ELIMINAR una reservación (Destroy)
  deleteReservacion(id: string): Observable<any> {
    // DELETE /reservaciones/:id
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}