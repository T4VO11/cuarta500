import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { ReglamentoService } from '../../services/reglamento'; 

@Component({
  selector: 'app-reglamentos-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './edit.html',
  styleUrl: './edit.css',
})
export class ReglamentosEditComponent implements OnInit {

  private reglamentoService = inject(ReglamentoService); 
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  reglamento: any = null; 
  isLoading: boolean = true;
  isSaving: boolean = false;
  
  // Objeto de formulario
  reglamentoForm = {
    _id: '',
    reglamento_id_num: 0, // Para guardar el ID numérico (reglamento)
    nombre: '',
    descripcion: '',
    pdf_url: '', 
    estado: 'activo'
  };
  
  archivoPDF: File | null = null; 

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || '6910f476625ce8db61ec8f57'; // Usar ID de la ruta
      this.loadReglamento(id);
    });
  }

  loadReglamento(id: string): void {
    this.reglamentoService.getReglamento(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito' && response.data) {
          this.reglamento = response.data;
          
          // Mapea los datos del API al formulario
          this.reglamentoForm._id = this.reglamento._id;
          this.reglamentoForm.reglamento_id_num = this.reglamento.reglamento; // 🚨 Cargar el ID numérico
          this.reglamentoForm.nombre = this.reglamento.nombre;
          this.reglamentoForm.descripcion = this.reglamento.descripcion;
          this.reglamentoForm.pdf_url = this.reglamento.catalogo_detalle?.pdf_url || '';
          this.reglamentoForm.estado = this.reglamento.estado;

          this.isLoading = false;
        } else {
          alert('Error al cargar datos del reglamento.');
          this.router.navigate(['/main/reglamentos']);
        }
      },
      error: (err) => {
        console.error('Error al cargar reglamento:', err);
        alert('Error de conexión.');
        this.router.navigate(['/main/reglamentos']);
      }
    });
  }
  
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoPDF = file;
      console.log('Archivo seleccionado:', file.name);
      this.reglamentoForm.pdf_url = `Temporalmente listo: ${file.name}`;
      alert(`Archivo ${file.name} listo para subirse. ¡Recuerda GUARDAR!`);
    } else {
        this.archivoPDF = null;
        this.reglamentoForm.pdf_url = this.reglamento.catalogo_detalle?.pdf_url || '';
    }
  }

  // 🚨 FUNCIÓN CORREGIDA: Asegurar que se envíen todos los campos de VALIDACIÓN
  guardarCambios(form: any): void {
    if (form.invalid) {
      alert('Por favor, revisa todos los campos.');
      return;
    }
    
    this.isSaving = true;
    
    // Usamos FormData en todos los casos porque tu Back-End espera JSON stringificado y files.
    const formData = new FormData();
    
    // ⬇️ 🚨 CLAVE DEL FIX: Enviamos el ID numérico que Express Validator requiere
    formData.append('reglamento', String(this.reglamentoForm.reglamento_id_num)); 
    
    formData.append('nombre', this.reglamentoForm.nombre);
    formData.append('descripcion', this.reglamentoForm.descripcion);
    formData.append('estado', this.reglamentoForm.estado);
    
    // Enviamos el PDF si se seleccionó uno nuevo
    if (this.archivoPDF) {
        formData.append('pdf', this.archivoPDF, this.archivoPDF.name);
    } 
    
    // Enviamos los datos del detalle (incluyendo la URL antigua si no subimos archivo)
    const catalogoDetalle = {
        pdf_url: this.archivoPDF ? undefined : this.reglamento.catalogo_detalle?.pdf_url // Si no hay file, enviamos la URL vieja
    };
    // Tu Back-End espera esto para hacer el merge, si no hay archivo, Multer no lo toca
    formData.append('catalogo_detalle', JSON.stringify(catalogoDetalle)); 

    // Enviamos FormData al servicio (la ruta de edición)
    this.reglamentoService.updateReglamento(this.reglamentoForm._id, formData).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.estado === 'exito') {
          alert('Reglamento actualizado correctamente.');
          this.router.navigate(['/main/reglamentos', this.reglamentoForm._id]); 
        } else {
          alert('Error al guardar: ' + response.mensaje);
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error al actualizar:', err);
        // Muestra el mensaje del Back-End si existe
        alert('Error al actualizar: ' + (err.error?.mensaje || 'Error de conexión.'));
      }
    });
  }
  
  regresar(): void {
    this.router.navigate(['/main/reglamentos', this.reglamentoForm._id]);
  }
}