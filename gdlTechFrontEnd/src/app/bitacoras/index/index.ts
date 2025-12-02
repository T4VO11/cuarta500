import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { BitacoraService } from '../../services/bitacora'; 

@Component({
  selector: 'app-bitacoras-index',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class BitacorasIndexComponent implements OnInit {
  
  private bitacoraService = inject(BitacoraService); 
  private router = inject(Router);

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
    console.log(Response);
  }
  
 
// -------------------------------------------------
// Normaliza y devuelve una URL válida para <img src>
// Acepta: string | objeto | null/undefined
// -------------------------------------------------
getImagenUrl(input: any): string {
  const BASE = 'http://localhost:3000';

  // 1) No hay nada
  if (!input) return '';

  // 2) Si te pasan todo el objeto, intenta extraer el path
  let path: any = input;
  if (typeof input === 'object') {
    // Extracción segura de posibles campos donde guardas la ruta
    path = input?.detalle_acceso?.imagen_ine_url
         || input?.imagen_ine_url
         || input?.detalle_acceso?.imagen_ine
         || input?.imagen;
  }

  if (!path) return '';

  // Asegurar que sea string
  path = String(path);

  // 3) Si ya es una URL absoluta (http/https) -> devolver tal cual
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // 4) Si ya viene con "uploads/..." o "bitacoras/..." -> normalizar
  const cleaned = path.replace(/^\//, ''); // quitar slash inicial si existe

  return `${BASE}/${cleaned}`;
}

// -------------------------------------------------
// Abre modal con imagen. Acepta input tipo objeto o string.
// -------------------------------------------------
verImagen(input: any): void {
  // Normalizar (getImagenUrl espera objeto o string)
  const url = this.getImagenUrl(input);

  console.log('verImagen - input:', input);
  console.log('verImagen - url normalizada:', url);

  if (!url) {
    alert('No se encontró imagen para mostrar.');
    return;
  }

  this.imagenModalUrl = url;
  // Opcional: titulo
  this.imagenModalTitulo = 'Documento';
}

  
  // Cierra el modal
  cerrarModal(): void {
      this.imagenModalUrl = null;
      
  }

  
}