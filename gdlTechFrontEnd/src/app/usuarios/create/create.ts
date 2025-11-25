import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; // Necesario para el formulario (ngModel)
import { UsuarioService } from '../../services/usuario'; 
import { Router, RouterModule } from '@angular/router'; // Para redirigir después de crear

@Component({
  selector: 'app-usuarios-create', 
  standalone: true, 
  imports: [CommonModule, FormsModule, RouterModule], // Importamos FormsModule
  templateUrl: './create.html', 
  styleUrl: './create.css',
})

export class UsuariosCreateComponent implements OnInit {
    
    // Inyecciones
    private usuarioService = inject(UsuarioService);
    private router = inject(Router); // Necesario para la redirección
    
    // Objeto para el formulario (copiado de la versión antigua de nuevoUsuario)
    nuevoUsuario: any = {
      usuario_id: '',
      condominio_id: 'C500', // Valor por defecto
      username: '',
      password: '',
      rol: 'dueño', // Valor por defecto
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      telefono: '',
      numero_casa: '',
      // Inicialización de la estructura anidada de perfil_detalle
      perfil_detalle: {
        rfc: '',
        nss: '',    
        auto: {
          modelo: '',   
          color: '',
          placas: ''
        }
      }
    };

    // Referencias a los archivos seleccionados
    imagenPerfilFile: File | null = null;
    imagenIneFile: File | null = null;

    ngOnInit(): void {
        // No hay lógica de carga al iniciar, solo se prepara el formulario vacío.
    }
  
    // ============== GESTIÓN DE ARCHIVOS ==============
      
    onFileSelected(event: any, tipo: 'perfil' | 'ine'): void {
      const file = event.target.files[0];
      if (tipo === 'perfil') {
        this.imagenPerfilFile = file;
      } else {
        this.imagenIneFile = file;
      }
      console.log(`Archivo de ${tipo} seleccionado: ${file.name}`);
    }

    // ============== ENVÍO DEL FORMULARIO (CREATE) ==============

    submitUsuarioForm(): void {
      const formData = new FormData();
      
      // 1. Añadir campos de texto
      // Itera sobre el objeto nuevoUsuario para llenar el FormData
      Object.keys(this.nuevoUsuario).forEach(key => {
          if (this.nuevoUsuario[key] !== null && this.nuevoUsuario[key] !== undefined) {
              if(key === 'perfil_detalle'){
                // El backend espera este campo como un JSON string
                formData.append(key, JSON.stringify(this.nuevoUsuario[key]));
              }
            else {
              formData.append(key, this.nuevoUsuario[key]);
            }
          }
      });
      
      // 2. Añadir los archivos
      if (this.imagenPerfilFile) {
        formData.append('imagen_perfil', this.imagenPerfilFile, this.imagenPerfilFile.name); 
      }
      if (this.imagenIneFile) {
        formData.append('imagen_ine', this.imagenIneFile, this.imagenIneFile.name); 
      }

      // 3. Llama al servicio para CREAR (POST)
      // Como no hay 'id' en esta función, llama a la ruta POST/registrar
      this.usuarioService.saveUsuario(formData).subscribe({
        next: (response) => {
          alert(response.mensaje || 'Usuario creado exitosamente.');
          // Redirigir al listado después de crear
          this.router.navigate(['/main/usuarios']); 
        },
        error: (err) => {
            console.error('Error al crear usuario:', err);
            alert(`Error al crear usuario: ${err.error.mensaje || err.message}`);
        }
      });
    }
}