import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { ReporteFinanzaService } from '../../services/reporte-finanza'; 

@Component({
  selector: 'app-reporteFinanzas-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './edit.html',
  styleUrl: './edit.css',
})
export class ReporteFinanzasEditComponent implements OnInit {
  
  private reporteFinanzaService = inject(ReporteFinanzaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  reporteId: string | null = null;

  // Objeto para el formulario (se precargará con los datos existentes)
  reporteForm: any = {
    reporte_id: null, 
    concepto: '', 
    fecha: '', 
    monto: null, 
    categoria: '', 
    descripcion: '',
    tipo_documento: '',
    current_imagen_url: '', // ⬅️ Aquí va la URL corregida
    usuario_id: 1, 
    condominio_id: 'C500' 
  };

  selectedFile: File | null = null; 
  isLoading: boolean = true;
  
  // Opciones de categoría 
  categorias: string[] = [
    'Servicios Básicos', 
    'Mantenimiento', 
    'Personal', 
    'Capital', 
    'Impuestos',
    'Otros'
  ];
  
  ngOnInit(): void {
    this.reporteId = this.route.snapshot.paramMap.get('id');
    if (this.reporteId) {
      this.loadReporte(this.reporteId);
    } else {
      this.isLoading = false;
      alert('Error: ID de reporte no proporcionado para edición.');
      this.regresar();
    }
  }

  /**
   * FIX CLAVE: Función para limpiar y forzar la URL estática local.
   * Resuelve el error ERR_NAME_NOT_RESOLVED (zwolfcondos.com) y el 401 (ruta protegida).
   */
  private _cleanImageUrl(originalUrl: string): string {
    if (!originalUrl) return 'https://via.placeholder.com/300x200?text=SIN+RECIBO';
    
    let path = originalUrl;

    // 1. Limpieza Agresiva: Quita cualquier prefijo de dominio (https://zwolfcondos.com/) y protocolo.
    path = path.replace(/^(https?:\/\/[^\/]+)/, ''); 
    
    // 2. Limpiar path relativo: Remueve prefijos conocidos que no deberían estar en el final de la URL (ej. /img/ o /uploads/)
    // La imagen debe ser accesible como: http://localhost:3000/uploads/reporteFinanzas/img.png
    // Por lo tanto, el path que enviamos debe ser: reporteFinanzas/img.png
    path = path.replace(/^(?:\/img\/|\/uploads\/|\/)/, ''); 
    
    // 3. Forzar el prefijo LOCAL de Express (http://localhost:3000/uploads/)
    // Esto asegura que la imagen se cargue de la ruta estática y pública.
    return `http://localhost:3000/uploads/${path}`;
  }


  // 1. Cargar datos existentes
  loadReporte(id: string): void {
    this.reporteFinanzaService.getReporte(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito' && response.data) {
          const data = response.data;
          
          this.reporteForm = {
            ...data,
            fecha: data.fecha ? data.fecha.substring(0, 10) : new Date().toISOString().substring(0, 10),
            tipo_documento: data.evidencia?.tipo_documento || 'Recibo',
            reporte_id: Number(data.reporte_id),
            // APLICAR EL FIX AL CARGAR LA URL DEL SERVIDOR
            current_imagen_url: this._cleanImageUrl(data.evidencia?.imagen_url || '')
          };

        } else {
          alert('Reporte no encontrado.');
          this.regresar();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener reporte para edición:', err);
        alert('Error de conexión al cargar datos.');
        this.isLoading = false;
      }
    });
  }

  // Manejar la selección de archivo
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
    }
  }

  // 2. Envía el formulario para ACTUALIZAR (PUT)
  submitReporte(form: any): void {
    if (form.invalid) {
      alert('Por favor, completa los campos requeridos.');
      return;
    }
    
    this.isLoading = true;
    
    // Usamos FormData SIEMPRE
    const formData = new FormData();
    
    // Enviamos los campos obligatorios para el Back-End
    formData.append('reporte_id', String(this.reporteForm.reporte_id)); 
    formData.append('condominio_id', this.reporteForm.condominio_id); 
    formData.append('usuario_id', String(this.reporteForm.usuario_id)); 
    formData.append('concepto', this.reporteForm.concepto);
    formData.append('fecha', new Date(this.reporteForm.fecha).toISOString()); 
    formData.append('monto', String(this.reporteForm.monto));
    formData.append('categoria', this.reporteForm.categoria);
    formData.append('descripcion', this.reporteForm.descripcion || '');
    
    // 1. Evidencia - Preparamos el objeto JSON
    const evidenciaData = {
        tipo_documento: this.reporteForm.tipo_documento,
        // Si no subimos archivo, MANTENEMOS el path que ya está guardado en el form (el original de la BD)
        imagen_url: this.selectedFile ? undefined : this.reporteForm.current_imagen_url 
    };

    // 2. Adjuntar el archivo 'imagen' (si hay uno nuevo)
    if (this.selectedFile) {
        // La clave debe ser 'imagen' para Multer
        formData.append('imagen', this.selectedFile, this.selectedFile.name);
    }
    
    // 3. Adjuntar el objeto de evidencia stringificado
    formData.append('evidencia', JSON.stringify(evidenciaData));


    if (this.reporteId) {
        this.reporteFinanzaService.saveReporte(formData, this.reporteId).subscribe({
          next: (response) => {
            this.isLoading = false;
            alert(response.mensaje || '¡Gasto de egreso actualizado exitosamente!');
            this.router.navigate(['/main/reporteFinanzas/show', this.reporteId]); 
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error al actualizar egreso:', err);
            alert('Error al actualizar: ' + (err.error?.mensaje || 'Error de validación (422).'));
          }
        });
    }
  }

  regresar(): void {
    this.router.navigate(['/main/reporteFinanzas']);
  }
}