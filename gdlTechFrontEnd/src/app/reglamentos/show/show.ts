import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { ReglamentoService } from '../../services/reglamento'; 
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // Para sanitizar la URL del iframe

@Component({
  selector: 'app-reglamentos-show',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './show.html',
  styleUrl: './show.css',
})
export class ReglamentosShowComponent implements OnInit {

  private reglamentoService = inject(ReglamentoService); 
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer); 

  reglamento: any = null;
  pdfUrl: SafeResourceUrl | null = null; 
  isLoading: boolean = true;
  reglamentoId: string = ''; 
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); 
      if (id) {
          this.reglamentoId = id;
          this.loadReglamento(id);
      } else {
          this.router.navigate(['/main/reglamentos']);
      }
    });
  }

  /**
   * FIX CLAVE: Construye la URL completa del archivo estático.
   * Asume que el Back-End sirve archivos estáticos bajo el prefijo /uploads/
   */
  private _getFullUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
        return relativePath; // Ya es una URL completa
    }
    // Tu ruta de BD es 'reglamentos/nombre.pdf'.
    // La ruta de acceso es típicamente: http://localhost:3000/uploads/reglamentos/nombre.pdf
    const fullUrl = `http://localhost:3000/uploads/${relativePath}`;
    console.log('DEBUG URL Generada para PDF:', fullUrl); // 🚨 LOG DE DEBUG
    return fullUrl;
  }


  loadReglamento(id: string): void {
    this.reglamentoService.getReglamento(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito' && response.data) {
          this.reglamento = response.data;
          
          // Se usa el helper para construir la URL completa y sanitizarla para el visor
          if (this.reglamento.catalogo_detalle?.pdf_url) {
              const fullUrl = this._getFullUrl(this.reglamento.catalogo_detalle.pdf_url);
              this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
          }
          this.isLoading = false;
        } else {
          alert('Reglamento no encontrado o error en la carga.');
          this.router.navigate(['/main/reglamentos']); 
        }
      },
      error: (err) => {
        console.error('Error al cargar reglamento:', err);
        alert('Error de conexión. Asegúrate de que Express esté corriendo.');
        this.router.navigate(['/main/reglamentos']); 
      }
    });
  }
  
  // Función para la descarga
  descargarPdf(): void {
    const url = this.reglamento.catalogo_detalle?.pdf_url;
    if (url) {
      // Se usa el helper para construir la URL completa
      const fullUrl = this._getFullUrl(url);
      // Abre la URL completa en una nueva pestaña
      window.open(fullUrl, '_blank');
    } else {
      console.error('URL de PDF no encontrada.');
      alert('La URL del reglamento no está disponible.'); 
    }
  }
  
  // Función para ir a editar
  goToEdit(): void {
      this.router.navigate(['/main/reglamentos', this.reglamentoId, 'edit']);
  }
}