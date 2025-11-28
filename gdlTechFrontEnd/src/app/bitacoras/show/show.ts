import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { BitacoraService } from '../../services/bitacora'; 

@Component({
  selector: 'app-bitacoras-show',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './show.html',
  styleUrl: './show.css',
})
export class BitacorasShowComponent implements OnInit {

  private bitacoraService = inject(BitacoraService); 
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  bitacora: any = null;
  isLoading: boolean = true;
  
  ngOnInit(): void {
    // Lee el ID de la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadBitacoraDetalle(id);
      } else {
        this.router.navigate(['/main/bitacoras']);
      }
    });
  }

  loadBitacoraDetalle(id: string): void {
    this.bitacoraService.getBitacora(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.bitacora = response.data;
          this.isLoading = false;
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.router.navigate(['/main/bitacoras']);
      }
    });
  }
  
  regresar(): void {
    this.router.navigate(['/main/bitacoras']);
  }
  
  getImagenUrl(bitacora: any): string | null {
    const path = bitacora?.detalle_acceso?.imagen_ine_url;
    if (!path) return null;
    return `http://localhost:3000/${path}`;
  }
}