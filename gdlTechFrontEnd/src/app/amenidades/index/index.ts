import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Para la navegación
import { AmenidadService } from '../../services/amenidad'; // Importa el servicio

@Component({
  selector: 'app-amenidades-index',
  standalone: true,
  // Usaremos RouterModule para los routerLinks de la tabla (Ver, Editar, Crear)
  imports: [CommonModule, RouterModule], 
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class AmenidadesIndexComponent implements OnInit {

  private amenidadService = inject(AmenidadService); 
  amenidades: any[] = []; // Array para guardar y mostrar los datos de la tabla

  imagenModalUrl: string | null = null; 
  imagenModalTitulo: string = '';

  ngOnInit(): void {
    this.loadAmenidades();
  }

  // LEER 
  
  loadAmenidades(): void {
    this.amenidadService.getAmenidades().subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.amenidades = response.data;
          console.log('Amenidades cargadas.',this.amenidades);
        } else {
          console.error('Respuesta inesperada:', response.mensaje);
        }
      },
      error: (err) => {
        console.error('Error al obtener amenidades (¿Token expirado?):', err);
      }
    });
  }
  
  // BORRAR 

  deleteAmenidad(id: string): void {
    if (confirm(`¿Estás seguro de eliminar la amenidad?`)) {
      this.amenidadService.deleteAmenidad(id).subscribe({
        next: (response) => {
          alert(response.mensaje || 'Amenidad eliminada exitosamente.');
          this.loadAmenidades(); 
        },
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }

  getImagenUrl(path: string | undefined | null): string {

  if (!path) {
    return 'https://via.placeholder.com/200';
  }

  const pathString = String(path);

  if (pathString.startsWith('http')) {
    return pathString;
  }

  // Si accidentalmente viene con /
  const cleanPath = pathString.replace(/^\//, '');

  return `http://localhost:3000/${cleanPath}`;
}



  // FUNCIÓN PARA ABRIR EL MODAL DE IMAGEN
    verImagen(url: string, tipo: string): void {
        this.imagenModalUrl = url;
        this.imagenModalTitulo = `Documento: ${tipo}`;
    }
    
    // FUNCIÓN PARA CERRAR EL MODAL
    cerrarModal(): void {
        this.imagenModalUrl = null;
    }
}