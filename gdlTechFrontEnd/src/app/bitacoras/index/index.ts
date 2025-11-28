import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Para los routerLinks de Detalle
import { BitacoraService } from '../../services/bitacora'; 

@Component({
  selector: 'app-bitacoras-index',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class IndexComponent implements OnInit {
  
  private bitacoraService = inject(BitacoraService); 

  bitacoras: any[] = [];
  
  // Lógica para modal de imágenes (si las hay en el detalle_acceso)
  imagenModalUrl: string | null = null; 
  imagenModalTitulo: string = '';

  ngOnInit(): void {
    this.loadBitacoras();
  }

  // Carga la lista de registros de bitácora
  loadBitacoras(): void {
    this.bitacoraService.getBitacoras().subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.bitacoras = response.data;
          console.log('Bitácoras cargadas.', this.bitacoras);
        }
      },
      error: (err) => console.error('Error al obtener bitácoras:', err)
    });
  }
  
  // Helper para mostrar imágenes si existe la URL
  getImagenUrl(bitacora: any): string | null {
    const path = bitacora.detalle_acceso?.imagen_ine_url;
    if (!path) return null;
    
    // Asumimos que tu Back-End te devuelve el path relativo (ej. 'bitacoras/imagen.jpg')
    return `http://localhost:3000/${path}`;
  }

  // Abre el modal de imagen si existe (similar al de Usuarios)
  verImagen(bitacora: any): void {
      const url = this.getImagenUrl(bitacora);
      if (url) {
          this.imagenModalUrl = url;
          this.imagenModalTitulo = `INE / Foto de Acceso: ${bitacora.detalle_acceso?.nombre_visitante || 'Visitante'}`;
      }
  }
  
  // Cierra el modal
  cerrarModal(): void {
      this.imagenModalUrl = null;
  }
}