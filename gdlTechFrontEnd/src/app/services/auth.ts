import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router'; //para redirigir en el logout
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL del backend desde environment (se adapta a producción/desarrollo)
  private baseUrl = environment.apiUrl; 
  private tokenKey = 'auth_token';

constructor(private http: HttpClient, private router: Router) { }

  //Envía las credenciales al Back-End y guarda el token JWT
  login(credentials: any): Observable<any> {
    // RUTA DE LOGIN: POST /usuarios/login
    return this.http.post(`${this.baseUrl}/usuarios/login`, credentials).pipe( 
      tap((response: any) => {
        // Tu Back-End usa JsonResponse: el token está en response.data.token
        if (response && response.data?.token) {
          localStorage.setItem(this.tokenKey, response.data.token);
        }
      }),
    );
  }

  //Borra el token, llama al endpoint de Express para invalidarlo y redirige
 logout(): Observable<any> {
     return this.http.post(`${this.baseUrl}/usuarios/logout`, {}).pipe(
        // Si la llamada es exitosa:
       tap(() => {
         console.log('Notificación al servidor exitosa.');
        }),
        // Si la llamada falla (401 Unauthorized):
        catchError(err => {
            console.warn('Error al notificar al servidor (', err.status , '). Procediendo a limpiar localmente.');
            return of(null); 
        }),
        tap(() => {
            console.log('Cerrando sesión local y redirigiendo.');
            localStorage.removeItem(this.tokenKey); // Borrar el token
            this.router.navigate(['login/index']);  // Redirigir al login
        })
    );
}

  // Devuelve el token guardado.
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  //Verifica si el usuario está logueado.
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      
      // Aquí manejamos tu estructura anidada (usuario.usuario.rol)
      // O la plana (usuario.rol) por si acaso.
      return decoded.usuario?.rol || decoded.rol || null;
      
    } catch (error) {
      return null;
    }
  }
}