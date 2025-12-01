import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { ReporteFinanzaService } from '../../services/reporte-finanza'; 

@Component({
  selector: 'app-reporteFinanzas-show',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe], 
  templateUrl: './show.html',
  styleUrl: './show.css',
})
export class ReporteFinanzasShowComponent implements OnInit {

  private reporteFinanzaService = inject(ReporteFinanzaService); 
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  reporte: any = null;
  isLoading: boolean = true;
  // SOLUCIÓN: Declarar la propiedad errorMessage para que el HTML la reconozca
  errorMessage: string | null = null; 
  
  ngOnInit(): void {
    // Lee el ID de la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadReporteDetalle(id);
      } else {
        this.router.navigate(['/main/reporteFinanzas']);
      }
    });
  }

  /**
   * Lógica del Helper de URL: Copia la lógica robusta para prevenir errores de dominio.
   * Esto es necesario para asegurar que el frontend siempre use 'http://localhost:3000/uploads/' 
   * sin importar lo que devuelva el backend (dominio, IP, etc.) y prevenir errores 401/404.
   */
  private _cleanImageUrl(originalUrl: string): string {
    // Si no hay URL, o es nula/indefinida, muestra un placeholder
    if (!originalUrl) return 'https://via.placeholder.com/300x200?text=SIN+EVIDENCIA';
    
    let path = originalUrl;

    // 1. Limpieza Agresiva: Quita cualquier prefijo de dominio (https://zwolfcondos.com/) y protocolo.
    path = path.replace(/^(https?:\/\/[^\/]+)/, ''); 
    
    // 2. Limpiar path relativo: Remueve prefijos conocidos como /uploads/ o /img/
    path = path.replace(/^(?:\/img\/|\/uploads\/|\/)/, ''); 
    
    // 3. Forzar el prefijo LOCAL de Express (http://localhost:3000/uploads/)
    return `http://localhost:3000/uploads/${path}`;
  }


  loadReporteDetalle(id: string): void {
    this.reporteFinanzaService.getReporte(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.reporte = response.data;
          this.isLoading = false;
        } else {
          this.isLoading = false;
          // Si hay error en la respuesta del back (ej. 404), mostramos mensaje
          this.errorMessage = response.mensaje || 'Reporte no encontrado.';
          this.regresar();
        }
      },
      error: (err) => {
        // Si hay error de conexión, mostramos mensaje de error
        this.errorMessage = 'Error al cargar detalle: Conexión fallida.';
        console.error('Error al cargar detalle:', err);
        this.isLoading = false;
        // this.router.navigate(['/main/reporteFinanzas']); // Mejor que no navegue para ver el error
      }
    });
  }
  
  regresar(): void {
    this.router.navigate(['/main/reporteFinanzas']);
  }
  
  // Navega a la vista de edición
  goToEdit(): void {
      if (this.reporte?._id) {
          this.router.navigate(['/main/reporteFinanzas/edit', this.reporte._id]);
      }
  }
  
  // FUNCIÓN para usar en el HTML
  getEvidenciaUrl(): string {
    // Accede a la URL de la imagen que viene dentro del objeto 'evidencia' del reporte
    const path = this.reporte?.evidencia?.imagen_url; 
    return this._cleanImageUrl(path || '');
  }
}