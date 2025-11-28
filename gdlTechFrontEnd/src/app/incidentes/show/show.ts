import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { IncidenteService } from '../../services/incidente'; 

@Component({
  selector: 'app-incidentes-show',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './show.html',
  styleUrl: './show.css',
})
export class ShowComponent implements OnInit {

  private incidenteService = inject(IncidenteService); 
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  incidente: any = null;
  isLoading: boolean = true;
  
  ngOnInit(): void {
    // Read the ID from the URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadIncidenteDetalle(id);
      } else {
        this.router.navigate(['/main/incidentes']);
      }
    });
  }

  loadIncidenteDetalle(id: string): void {
    this.incidenteService.getIncidente(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.incidente = response.data;
          this.isLoading = false;
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.router.navigate(['/main/incidentes']);
      }
    });
  }
  
  regresar(): void {
    this.router.navigate(['/main/incidentes']);
  }
  
  // Navigate to the edit view
  goToEdit(): void {
      if (this.incidente?._id) {
          this.router.navigate(['/main/incidentes/edit', this.incidente._id]);
      }
  }
}