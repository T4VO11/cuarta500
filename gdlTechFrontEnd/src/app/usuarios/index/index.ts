import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { UsuarioService } from '../../services/usuario'; // Servicio de CRUD
import { RouterModule } from '@angular/router'; // Para usar routerLink en la tabla

@Component({
  selector: 'app-usuarios-index', // Nombre actualizado
  standalone: true,
  // ¡OJO! Quitamos FormsModule de aquí
  imports: [CommonModule, RouterModule], 
  templateUrl: './index.html', // Archivo HTML limpio
  styleUrl: './index.css',
})

export class UsuariosIndexComponent implements OnInit {
    
    // Inyecciones
    private usuarioService = inject(UsuarioService);
    
    // VARIABLES PRINCIPALES (Solo lo necesario para la tabla)
    usuarios: any[] = [];
    
    // Variables para la vista modal de imágenes
    imagenModalUrl: string | null = null; 
    imagenModalTitulo: string = '';
    
    // No necesitamos nuevoUsuario ni usuarioAEditar en este componente

   ngOnInit(): void {
        this.loadUsuarios();
    }
  
   // ============== 1. LEER (Read) ===================
  
  loadUsuarios(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.usuarios = response.data;
          console.log('Usuarios cargados:', this.usuarios);
        }
      },
      error: (err) => console.error('Error al obtener usuarios:', err)
    });
  }

  // ============== 2. ELIMINAR (Delete) ===================
    
  deleteUsuario(id: string): void {
      if (confirm(`¿Estás seguro de eliminar el usuario?`)) {
        this.usuarioService.deleteUsuario(id).subscribe({
          next: (response) => {
            alert(response.mensaje || 'Usuario eliminado exitosamente.');
            this.loadUsuarios(); // Recargar la lista
          },
          error: (err) => console.error('Error al eliminar:', err)
        });
      }
    }
    
    // ============== 3. VISUALIZACIÓN DE IMÁGENES ===================

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