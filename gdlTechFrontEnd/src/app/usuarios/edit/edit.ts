import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; // Necesario para el formulario (ngModel)
import { UsuarioService } from '../../services/usuario'; 
import { Router, ActivatedRoute, RouterModule } from '@angular/router'; // Importa ActivatedRoute

@Component({
  selector: 'app-usuarios-edit', 
  standalone: true, 
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './edit.html', 
  styleUrl: './edit.css',
})

export class UsuariosEditComponent implements OnInit {
    
    // Inyecciones
    private usuarioService = inject(UsuarioService);
    private router = inject(Router);
    private route = inject(ActivatedRoute); // Para obtener el ID de la URL
    
    // Objeto que se cargará con los datos existentes
    usuarioAEditar: any = null;
    usuarioId: string | null = null; // ID que viene de la URL
    
    // Referencias a los archivos seleccionados para subir (solo si se cambian)
    imagenPerfilFile: File | null = null;
    imagenIneFile: File | null = null;
    
    isLoading: boolean = true;
    errorMessage: string | null = null;

    ngOnInit(): void {
        // 1. Obtener el 'id' de la ruta
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.usuarioId = id;
                this.loadUsuarioDetalle(id);
            } else {
                this.errorMessage = 'ID de usuario no proporcionado.';
                this.isLoading = false;
            }
        });
    }

    // 2. Cargar los datos del usuario existente
    loadUsuarioDetalle(id: string): void {
        this.usuarioService.getUsuario(id).subscribe({
            next: (response) => {
                if (response && response.estado === 'exito' && response.data) {
                    this.usuarioAEditar = response.data;
                    // ¡CRUCIAL! Limpiar la contraseña para que el formulario no la envíe
                    // y el backend no la sobrescriba con un valor nulo/vacío
                    this.usuarioAEditar.password = ''; 
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
  
    // ============== GESTIÓN DE ARCHIVOS ==============
      
    onFileSelected(event: any, tipo: 'perfil' | 'ine'): void {
      const file = event.target.files[0];
      if (tipo === 'perfil') {
        this.imagenPerfilFile = file;
      } else {
        this.imagenIneFile = file;
      }
      console.log(`Archivo de ${tipo} seleccionado para actualizar: ${file.name}`);
    }

    // ============== ENVÍO DEL FORMULARIO (UPDATE) ==============

    // En UsuariosEditComponent (usuarios-edit.ts)

submitUsuarioForm(): void {
    if (!this.usuarioId || !this.usuarioAEditar) return;

    const formData = new FormData();
    
    // 1. Lógica para eliminar la contraseña si está vacía (¡LA CLAVE!)
    // Ya que usuarioAEditar.password se inicializó como '' en ngOnInit
    if (this.usuarioAEditar.password === '') {
        // Elimina la propiedad del objeto antes de iterar, para que no se envíe.
        delete this.usuarioAEditar.password; 
    }
    
    // 2. Añadir campos de texto
    // Itera sobre el objeto usuarioAEditar actualizado
    Object.keys(this.usuarioAEditar).forEach(key => {
        if (this.usuarioAEditar[key] !== null && this.usuarioAEditar[key] !== undefined) {
            
            if (key === 'perfil_detalle') {
                // Serialización del objeto anidado
                formData.append(key, JSON.stringify(this.usuarioAEditar[key]));
            }
            // Asegúrate de que solo agregas propiedades que no son metadatos del backend.
            else if (key !== 'documentos' && key !== '__v' && key !== '_id') {
                formData.append(key, this.usuarioAEditar[key]);
            }
        }
    });

    // 3. Añadir los archivos (esto se queda igual)
    if (this.imagenPerfilFile) {
      formData.append('imagen_perfil', this.imagenPerfilFile, this.imagenPerfilFile.name); 
    }
    if (this.imagenIneFile) {
      formData.append('imagen_ine', this.imagenIneFile, this.imagenIneFile.name); 
    }

    // 4. Llama al servicio para ACTUALIZAR (PUT)
    // ... Llama al servicio para ACTUALIZAR (PUT)
this.usuarioService.saveUsuario(formData, this.usuarioId).subscribe({
    next: (response) => {
        // 1. Mostrar mensaje de éxito (¡CLAVE!)
        alert(response.mensaje || 'Usuario actualizado exitosamente.'); 
        
        // 2. Redirigir al listado
        this.router.navigate(['/main/usuarios']); 
    },
    error: (err) => {
        // Manejo del error
        console.error('Error al actualizar usuario:', err);
        // Muestra el mensaje de error que viene del backend o uno genérico
        alert(`Error al actualizar usuario: ${err.error?.mensaje || 'Error de conexión.'}`);
    }
    });
  }
      
}