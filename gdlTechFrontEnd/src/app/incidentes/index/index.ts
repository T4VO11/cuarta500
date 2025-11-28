import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { IncidenteService } from '../../services/incidente'; 

@Component({
  selector: 'app-incidentes-index',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class IncidentesIndexComponent implements OnInit {
  
  private incidenteService = inject(IncidenteService); 
  private router = inject(Router);

  incidentes: any[] = [];

  ngOnInit(): void {
    this.loadIncidentes();
  }

  // Carga la lista de incidentes
  loadIncidentes(): void {
    this.incidenteService.getIncidentes().subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.incidentes = response.data;
        }
      },
      error: (err) => console.error('Error al obtener incidentes:', err)
    });
  }
  
  // Elimina un incidente
  deleteIncidente(id: string): void {
    if (confirm(`¿Estás seguro de eliminar el incidente ${id}?`)) {
      this.incidenteService.deleteIncidente(id).subscribe({
        next: (response) => {
          alert(response.mensaje || 'Incidente eliminado exitosamente.');
          this.loadIncidentes(); 
        },
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }
}