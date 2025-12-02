import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { AmenidadService } from '../../services/amenidad';

@Component({
  selector: 'app-amenidades-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class AmenidadesCreateComponent {

  private amenidadService = inject(AmenidadService); 
  private router = inject(Router);

 // contGaleria = 0;
 // galeria : any = {
 //   galeria_urls: []
 // }

 //variable para las vistas previas locales de Base64
localPreviews: { url: string | ArrayBuffer | null, file: File }[] = [];

  // Objeto limpio para el formulario de Creación
 nuevaAmenidad: any = {
    // Campos Básicos
    amenidad_id: 1, 
    condominio_id: 'C500', 
    tipo: 'servicio',
    nombre: '',
    descripcion: '',
    estado: 'activo',
    catalogo_detalle: {
        precio: 0,
        categoria: '', 
        motivo: ''
    },
    reglas_apartado: {
        costo_apartado: 0,
        extras_disponibles: [],
        dias_permitidos: [], 
        horario_maximo_horas: 0, 
        capacidad_maxima: 1,
        horario_inicio: '09:00', 
        horario_fin: '18:00',
    },
    // transaccion_detalle (Solo se inicializa, no se debe editar aquí)
    transaccion_detalle: {
        estadopago: '',
        fecha_evento: '',
        hora_fin: '',
        hora_inicio: '',
        monto: 0,
        plataforma_pago: '',
        transaccion_id: ''
    }
};

  selectedFiles: File[] = []; // Array temporal para guardar los archivos de la galería

  // GESTIÓN DE ARCHIVOS 

//   buildImageUrl (imagePath:string): string {
//     if (!imagePath) return '';
//     console.log('create buildImageUrl - imagePath:', imagePath);
    
//     // Construir URL completa
//     const protocol = 'http';
//     const host = 'localhost:3000';
    
    
//     return `${protocol}://${host}/amenidad/${imagePath}`;
// }
//   /**
//    * Construir múltiples URLs de imágenes (para arrays)
//    */
//    buildImageUrls(imagePaths:string): string  {
//       console.log('create buildImageUrls - imagePaths:', imagePaths);
     
      
//       return this.buildImageUrl( imagePaths);
//   }


agregarServicioExtra() {
    // Nos aseguramos que el objeto y el array existan antes de hacer push
    if (!this.nuevaAmenidad.reglas_apartado) {
      this.nuevaAmenidad.reglas_apartado = { extras_disponibles: [] };
    }
    if (!this.nuevaAmenidad.reglas_apartado.extras_disponibles) {
      this.nuevaAmenidad.reglas_apartado.extras_disponibles = [];
    }

    // Agregamos un objeto vacío para que aparezcan los inputs en el HTML
    this.nuevaAmenidad.reglas_apartado.extras_disponibles.push({
      nombre: '',
      costo: 0,
      descripcion: '' // Opcional
    });
  }

  // Función para ELIMINAR una fila de la lista visual
  eliminarServicioExtra(index: number) {
    this.nuevaAmenidad.reglas_apartado.extras_disponibles.splice(index, 1);
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files); 
    this.localPreviews = []; // Limpiar previas anteriores
    
    // Generar las URLs Base64 SOLO para mostrar en el frontend
    this.selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Guardamos la URL temporal (Base64) junto con el archivo original
            this.localPreviews.push({ 
                url: e.target?.result || null,
                file: file 
            });
        };
        reader.readAsDataURL(file);
    });
   // this.galeria.galeria_urls.push(...this.selectedFiles.map(file => this.buildImageUrls( file.name)));
   // this.contGaleria = this.contGaleria + this.selectedFiles.length;
  }

  // FUNCIÓN DE CREACIÓN 

  submitAmenidadForm(): void {
    const formData = new FormData();
    
    // A. Añadir campos de texto
    // Iterar sobre el objeto para no olvidar nada
    Object.keys(this.nuevaAmenidad).forEach(key => {
    const value = this.nuevaAmenidad[key];
    
    // Si el valor es un objeto (como reglas_apartado o catalogo_detalle)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Convierte el objeto a string JSON
        formData.append(key, JSON.stringify(value)); 
    } else {
        // Campos simples o arrays vacíos
        formData.append(key, value);
    }
});
    
    // B. Añadir los archivos (galeria)
    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(file => {
        console.log(`Añadiendo archivo al FormData: ${file.name}`);
        formData.append('galeria', file, file.name); 
      });
    }
    //cuarta500/gdlTechBackEnd/uploads/usuarios/imagen_ine-1762811505472-528194865.jpg
    // Llama al servicio para CREAR (POST)
    this.amenidadService.saveAmenidad(formData).subscribe({
      next: (response) => {
        alert(response.mensaje || 'Amenidad creada exitosamente.');
        // Redirigir al listado
        this.router.navigate(['/main/amenidades']); 
      },
      error: (err) => console.error('Error al guardar amenidad:', err)
    });
  }
}