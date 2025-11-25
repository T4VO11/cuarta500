import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Para la ruta y la navegación
import { UsuarioService } from '../../services/usuario'; // Tu servicio de datos

@Component({
  selector: 'app-usuarios-show',
  standalone: true, 
  imports: [CommonModule, RouterModule], 
  templateUrl: './show.html',
  styleUrl: './show.css'
})

export class ShowUsuarioComponent implements OnInit { 

  private route = inject(ActivatedRoute); // Para leer el ID
  private router = inject(Router);       // Para la navegación
  private usuarioService = inject(UsuarioService);

  usuario: any = null; // Variable donde se guardará el usuario cargado
  isLoading: boolean = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    // 1. Obtiene el 'id' de la ruta activa
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadUsuarioDetalle(id);
      } else {
        this.errorMessage = 'ID de usuario no proporcionado.';
        this.isLoading = false;
      }
    });
  }

  // 2. Llama al servicio para obtener el usuario por ID
  loadUsuarioDetalle(id: string): void {
    this.usuarioService.getUsuario(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.usuario = response.data; // Asigna la data a la variable 'usuario'
          this.isLoading = false;
        } else {
          this.errorMessage = response.mensaje || 'Error al cargar el detalle.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMessage = 'Error de conexión o recurso no encontrado.';
        this.isLoading = false;
        console.error('Error al cargar detalle:', err);
      }
    });
  }
  
  // 3. Función para regresar a la lista de usuarios
  regresar(): void {
    this.router.navigate(['/main/usuarios']);
  }
}