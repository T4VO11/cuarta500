import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngIf y *ngFor
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { AmenidadService } from '../../services/amenidad'; 

@Component({
  selector: 'app-amenidades-show',
  standalone: true, 
  imports: [CommonModule, RouterModule], 
  templateUrl: './show.html',
  styleUrl: './show.css'
})

export class AmenidadesShowComponent implements OnInit { 

  private route = inject(ActivatedRoute); // Para leer el ID
  private router = inject(Router);       // Para la navegación
  private amenidadService = inject(AmenidadService);

  amenidad: any = null; // Variable donde se guardará la amenidad cargada
  isLoading: boolean = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    // 1. Obtiene el 'id' de la ruta activa
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadAmenidadDetalle(id);
      } else {
        this.errorMessage = 'ID de amenidad no proporcionado.';
        this.isLoading = false;
      }
    });
  }

  // 2. Llama al servicio para obtener la amenidad por ID
  loadAmenidadDetalle(id: string): void {
    this.amenidadService.showAmenidad(id).subscribe({
      next: (response) => {
        console.log('Respuesta de showAmenidad:', response);
        if (response && response.estado === 'exito') {
          this.amenidad = response.data; 
          this.isLoading = false;
        } else {
          this.errorMessage = response.mensaje || 'Error al cargar el detalle.';
          this.isLoading = false;
          console.log('URLs de galería recibidas (con navegación segura):', 
                      this.amenidad?.reglas_apartado?.galeria_urls);
        }
      },
      error: (err) => {
        this.errorMessage = 'Error de conexión o recurso no encontrado.';
        this.isLoading = false;
        console.error('Error al cargar detalle de amenidad:', err);
      }
    });
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


  
  // 3. Función para regresar a la lista de amenidades
  regresar(): void {
    this.router.navigate(['/main/amenidades']);
  }
}