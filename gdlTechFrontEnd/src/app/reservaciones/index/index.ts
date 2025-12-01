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