import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exito',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './exito.html'
})
export class ExitoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  
  // Asegúrate de que esta ruta coincida con tu backend (si usas prefijo /api, agrégalo)
  private apiUrl = 'http://localhost:3000/listadoAdeudos'; 

  isLoading = true;
  mensaje = 'Verificando tu pago con el banco...';
  exito = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      
      if (sessionId) {
         this.verificarPago(sessionId);
      } else {
         // Si alguien entra directo a la URL sin pagar, mostramos error
         this.isLoading = false;
         this.exito = false;
         this.mensaje = 'No se encontró información de la sesión de pago.';
      }
    });
  }

  verificarPago(sessionId: string) {
      this.http.post(`${this.apiUrl}/confirmar-pago-mantenimiento`, { session_id: sessionId })
          .subscribe({
              next: (res: any) => {
                  console.log('Respuesta Backend:', res);
                  // 1. IMPORTANTE: Apagar el spinner
                  this.isLoading = false;
                  // 2. Marcar éxito
                  this.exito = true;
                  this.mensaje = '¡Pago de mantenimiento registrado correctamente!';
              },
              error: (err) => {
                  console.error('Error confirmando pago:', err);
                  // 1. IMPORTANTE: Apagar el spinner también en error
                  this.isLoading = false;
                  // 2. Marcar fallo
                  this.exito = false;
                  this.mensaje = 'El pago se procesó en Stripe, pero hubo un error al guardarlo en el sistema. Por favor toma captura y contacta al administrador.';
              }
          });
  }
}