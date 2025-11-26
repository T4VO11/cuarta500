import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { ReservacionService } from '../../services/reservacion'; 

@Component({
  selector: 'app-reservaciones-show',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './show.html',
  styleUrl: './show.css',
})
export class ShowComponent implements OnInit {

  private reservacionService = inject(ReservacionService); 
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  reservacion: any = null;
  isLoading: boolean = true;
  
  ngOnInit(): void {
    // Lee el ID de la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadReservacionDetalle(id);
      } else {
        this.router.navigate(['/main/reservaciones']);
      }
    });
  }

  loadReservacionDetalle(id: string): void {
    this.reservacionService.getReservacion(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.reservacion = response.data;
          this.isLoading = false;
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.router.navigate(['/main/reservaciones']);
      }
    });
  }
  
  regresar(): void {
    this.router.navigate(['/main/reservaciones']);
  }
}