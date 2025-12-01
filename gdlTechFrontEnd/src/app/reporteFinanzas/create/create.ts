import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { ReporteFinanzaService } from '../../services/reporte-finanza'; 

@Component({
  selector: 'app-reporteFinanzas-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class ReporteFinanzasCreateComponent {
  
  private reporteFinanzaService = inject(ReporteFinanzaService);
  private router = inject(Router);
  
  // Objeto para el formulario (con valores por defecto)
  reporteForm: any = {
    concepto: '', 
    fecha: this.getTodayDateString(), // Fecha de hoy en formato YYYY-MM-DD
    monto: null, 
    categoria: 'Servicios Básicos', // Categoría por defecto
    descripcion: '',
    tipo_documento: 'Recibo', 
    // Campos que el Back-End requiere, aunque no estén en el formulario:
    reporte_id: Math.floor(Math.random() * 900) + 100, // ID numérico temporal
    usuario_id: 1 // ID de usuario fijo
  };

  selectedFile: File | null = null;
  isLoading: boolean = false;
  
  // Opciones de categoría
  categorias: string[] = [
    'Servicios Básicos', 
    'Mantenimiento', 
    'Personal', 
    'Capital', 
    'Impuestos',
    'Otros'
  ];

  // Helper para obtener la fecha de hoy en formato YYYY-MM-DD
  getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Manejar la selección de archivo (recibo)
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
    }
  }

  // Envía el formulario (POST)
  submitReporte(form: any): void {
    if (form.invalid) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }
    
    // 🚨 Nueva validación para archivo, ya que es obligatorio para el Back-End
    if (!this.selectedFile) {
        alert('Debes adjuntar la evidencia (recibo) del gasto.');
        return;
    }
    
    this.isLoading = true;
    
    const formData = new FormData();
    
    // 1. Asignar campos de texto y numéricos obligatorios
    formData.append('reporte_id', String(this.reporteForm.reporte_id));
    formData.append('condominio_id', 'C500'); 
    formData.append('usuario_id', String(this.reporteForm.usuario_id)); 
    
    formData.append('concepto', this.reporteForm.concepto);
    // Convertir la fecha a formato ISO 8601 (requerido por el back-end)
    formData.append('fecha', new Date(this.reporteForm.fecha).toISOString()); 
    formData.append('monto', String(this.reporteForm.monto));
    formData.append('categoria', this.reporteForm.categoria);
    formData.append('descripcion', this.reporteForm.descripcion || '');
    
    // 2. Adjuntar el archivo de evidencia con el nombre 'imagen'
    // 🚨 FIX CLAVE: EL BACK-END ESPERA EL CAMPO LLAMADO 'imagen'
    formData.append('imagen', this.selectedFile, this.selectedFile.name);
    
    // 3. Datos de la evidencia (JSON)
    const evidenciaData = {
        tipo_documento: this.reporteForm.tipo_documento,
    };
    // El Back-End espera el campo 'evidencia' como JSON stringificado
    formData.append('evidencia', JSON.stringify(evidenciaData));


    this.reporteFinanzaService.saveReporte(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        alert(response.mensaje || '¡Gasto de egreso registrado exitosamente!');
        this.router.navigate(['/main/reporteFinanzas']); // Redirigir al índice
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al registrar egreso:', err);
        // Muestra el error de validación 422 si existe
        alert('Error al registrar egreso: ' + (err.error?.mensaje || 'Hubo un error en el servidor (500).'));
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/main/reporteFinanzas']);
  }
}