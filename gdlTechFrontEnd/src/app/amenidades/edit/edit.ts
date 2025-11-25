import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router'; 
import { AmenidadService } from '../../services/amenidad'; 

@Component({
  selector: 'app-amenidades-edit',
  standalone: true,
  // Necesitamos FormsModule para [(ngModel)], CommonModule para *ngIf, y Router para navegar.
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './edit.html',
  styleUrl: './edit.css',
})
export class AmenidadesEditComponent implements OnInit {

  private amenidadService = inject(AmenidadService); 
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  amenidadAEditar: any = null; // Objeto que guarda los datos cargados del servidor
  amenidadId: string | null = null;
  selectedFiles: File[] = []; // Array temporal para nuevos archivos
  
  isLoading: boolean = true;
  errorMessage: string | null = null;

  

  ngOnInit(): void {
    // 1. Obtener el ID de la URL
    this.route.paramMap.subscribe(params => {
        this.amenidadId = params.get('id');
        if (this.amenidadId) {
            this.loadAmenidadDetalle(this.amenidadId);
        } else {
            this.errorMessage = 'ID de amenidad no proporcionado.';
            this.isLoading = false;
        }
    });
  }

  //  LÓGICA DE CARGA 

  loadAmenidadDetalle(id: string): void {
      // Usamos showAmenidad(id) de tu servicio (asumiendo que ya lo creaste)
      this.amenidadService.showAmenidad(id).subscribe({
          next: (response) => {
              if (response && response.estado === 'exito' && response.data) {
                  this.amenidadAEditar = response.data; // Carga los datos al objeto
                  this.isLoading = false;
              } else {
                  this.errorMessage = response.mensaje || 'Amenidad no encontrada.';
                  this.isLoading = false;
              }
          },
          error: (err) => {
              this.errorMessage = 'Error de conexión o al cargar datos.';
              this.isLoading = false;
              console.error('Error al cargar amenidad:', err);
          }
      });
  }

  //  GESTIÓN DE ARCHIVOS 

  onFileSelected(event: any): void {
    // Almacena los nuevos archivos seleccionados
    this.selectedFiles = Array.from(event.target.files); 
  }
  
  // Opción para eliminar una imagen existente de la galería (solo localmente, el PUT hace el resto)
  // NOTA: La lógica de eliminar del servidor es compleja. Aquí solo la simulamos.
  removerImagen(url: string): void {
      if (confirm('¿Estás seguro de quitar esta imagen? Se borrará al guardar.')) {
          // Filtra la URL de la lista para que no se envíe de vuelta al guardar (PUT)
          this.amenidadAEditar.reglas_apartado.galeria_urls = 
              this.amenidadAEditar.reglas_apartado.galeria_urls.filter((u: string) => u !== url);
      }
  }

  //  FUNCIÓN DE EDICIÓN (PUT) 

  submitAmenidadForm(): void {
    if (!this.amenidadId || !this.amenidadAEditar) return;

    const formData = new FormData();
    
    // Lista de campos que NO deben enviarse en el cuerpo (metadatos o IDs sensibles)
    const EXCLUIR_CAMPOS = ['__v', '_id', 'createdAt', 'updatedAt', 'espacio_ref_id', 'usuario_id']; 

    // Iterar sobre el objeto editado para serializar y excluir
    Object.keys(this.amenidadAEditar).forEach(key => {
        const value = this.amenidadAEditar[key];

        // 1. Exclusión (Crucial para no enviar IDs sensibles)
        if (EXCLUIR_CAMPOS.includes(key)) {
             return; // No incluir este campo en el FormData
        }

        // 2. Serializar objetos anidados (catalogo_detalle, reglas_apartado)
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        
        let objetoAEnviar = value;
        // 💡 1. EXCLUIR GALERIA_URLS DEL PAYLOAD DEL FRONTEND (¡CRÍTICO!)
        if (key === 'reglas_apartado') {
             // Clona el objeto para no modificar el estado local y elimina la propiedad
             objetoAEnviar = { ...value };
             delete objetoAEnviar.galeria_urls; 
        }
        
        formData.append(key, JSON.stringify(objetoAEnviar));
      } else {
             // 3. Envío de campos básicos (incluyendo strings vacíos, que son válidos si son opcionales)
             formData.append(key, value);
        }
    });
    
    // B. Añadir los nuevos archivos
    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(file => {
        // 'galeria' debe coincidir con el nombre de campo de Multer en tu Express
        formData.append('galeria', file, file.name); 
      });
    }

    // Llama al servicio para ACTUALIZAR (PUT)
    this.amenidadService.saveAmenidad(formData, this.amenidadId).subscribe({
      next: (response) => {
        alert(response.mensaje || 'Amenidad actualizada exitosamente.');
        this.router.navigate(['/main/amenidades']); // Redirigir al listado
      },
      error: (err) => {
          console.error('Error al actualizar amenidad:', err);
          alert(`Error al actualizar: ${err.error?.mensaje || 'Error de conexión.'}`);
      }
    });
  }
  
  // Función para regresar
  regresar(): void {
    this.router.navigate(['/main/amenidades']);
  }
}