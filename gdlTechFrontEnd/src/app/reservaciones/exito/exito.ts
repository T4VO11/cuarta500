import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Importar HttpClient
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exito',
  standalone: true,
  imports: [RouterModule, CommonModule], // Agrega CommonModule para *ngIf
  templateUrl: './exito.html' // O exito.component.html
})
export class ExitoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient); // Inyectamos HTTP directamente o usa tu servicio
  
  // Ajusta esto a tu URL real
  private apiUrl = 'http://localhost:3000/reservaciones'; 

  isLoading = true;
  mensaje = 'Verificando tu pago con el banco...';
  exito = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      
      if (sessionId) {
        this.verificarPago(sessionId);
      } else {
        this.isLoading = false;
        this.mensaje = 'No se encontró información del pago.';
      }
    });
  }

  verificarPago(sessionId: string) {
    // Llamamos al nuevo endpoint del backend
    this.http.post(`${this.apiUrl}/confirmar-pago`, { session_id: sessionId })
      .subscribe({
        next: (res: any) => {
          console.log('Pago confirmado:', res);
          this.isLoading = false;
          this.exito = true;
          this.mensaje = '¡Tu reservación ha sido pagada y confirmada!';
        },
        error: (err) => {
          console.error('Error verificando:', err);
          this.isLoading = false;
          this.exito = false;
          this.mensaje = 'El pago se realizó, pero hubo un error actualizando la reservación. Contacta a administración.';
        }
      });
  }
}