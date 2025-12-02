import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { ReservacionService } from '../../services/reservacion';
import { AuthService } from '../../services/auth'; 

@Component({
  selector: 'app-reservaciones-index',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class IndexComponent implements OnInit {

  //roles
  userRole: string | null = null;
  constructor(private authService: AuthService) { }
  
  private reservacionService = inject(ReservacionService); 
  private router = inject(Router);

  reservaciones: any[] = [];
  
  ngOnInit(): void {
    this.loadReservaciones();
    this.userRole = this.authService.getRole();
  }

  // Carga la tabla de reservaciones
  loadReservaciones(): void {
    this.reservacionService.getReservaciones().subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.reservaciones = response.data;
          console.log('Reservaciones cargadas.');
        }
      },
      error: (err) => console.error('Error al obtener reservaciones:', err)
    });
  }
  
  // Elimina una reservación
  deleteReservacion(id: string): void {
    if (confirm(`¿Estás seguro de eliminar la reservación ${id}?`)) {
      this.reservacionService.deleteReservacion(id).subscribe({
        next: (response) => {
          alert(response.mensaje || 'Reservación eliminada exitosamente.');
          this.loadReservaciones(); 
        },
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }

  pagarReservacion(reservacion: any): void {
    if (!confirm(`¿Deseas proceder al pago de la reservación #${reservacion.reservacion_id}?`)) {
      return;
    }

    // 1. Preparar los extras
    // Tu reserva guarda objetos {nombre, costo}, pero el backend de pago espera solo nombres ["Mesas", "Sonido"]
    const extrasNombres = reservacion.servicios_extra 
        ? reservacion.servicios_extra.map((s: any) => s.nombre) 
        : [];

    // 2. Preparar el payload
    const payload = {
        // IMPORTANTE: Aquí necesitamos el ID de la amenidad.
        // Si lo guardaste en la reserva, usa: reservacion.amenidad_id
        // Si NO lo guardaste y solo es la Terraza, pon el ID fijo de la Terraza aquí.
        amenidadId: reservacion.amenidad_id || '2', 
        
        extrasSeleccionados: extrasNombres,

        reservacionId: reservacion._id // Enviamos el ID de Mongo
    };

    // 3. Llamar al servicio (El mismo que usas en Create)
    this.reservacionService.iniciarPagoStripe(payload).subscribe({
        next: (res) => {
            if (res.data && res.data.url) {
                // Redirigir a Stripe
                window.location.href = res.data.url;
            }
        },
        error: (err) => {
            console.error('Error al iniciar pago:', err);
            alert('No se pudo conectar con la pasarela de pagos.');
        }
    });
  }

  // Navega a la edición
  goToEdit(id: string): void {
    this.router.navigate(['/main/reservaciones/edit', id]);
  }

  get isAdmin(): boolean {
    return this.userRole === 'administrador';
  }

  get isDueno(): boolean {
    return this.userRole === 'dueño';
  }
}