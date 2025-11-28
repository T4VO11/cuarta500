import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { IncidenteService } from '../../services/incidente'; 

@Component({
  selector: 'app-incidentes-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class CreateComponent {
  
  private incidenteService = inject(IncidenteService);
  private router = inject(Router);
  
  // Objeto para el formulario (Creación)
  incidenteForm: any = {
    incidente_id: null, 
    asunto: '',
    numeroCasa: null,
    categoria: 'Mantenimiento',
    descripcion: '',
    estado: 'reportado',
    nombre_reporta: '', // Campo visible para el admin/usuario
    usuario_id: 1, // FIX: Usuario_ID por defecto para pasar la validación de Express
    fecha_reporte: new Date().toISOString().substring(0, 10),
  };
  
  categorias = ['Mantenimiento', 'Seguridad', 'Vandalismo', 'Quejas', 'Otro'];
  estados = ['reportado', 'abierto', 'en_proceso', 'resuelto', 'cerrado'];

  // Envía el formulario (Crear)
  submitIncidente(form: any): void {
    if (form.invalid) {
      alert('Por favor, llena todos los campos obligatorios.');
      return;
    }
    
    // mapeado de los datos para el Back-End
    const dataToSend = {
        ...this.incidenteForm,
        numeroCasa: Number(this.incidenteForm.numeroCasa),
        incidente_id: Number(this.incidenteForm.incidente_id), 
        
        // Nos aseguramos de enviar el usuario_id como número
        usuario_id: this.incidenteForm.usuario_id ? Number(this.incidenteForm.usuario_id) : 1, 
        
        // se quita el campo de la vista para que Express Validator no falle
        nombre_reporta: undefined 
    };

    this.incidenteService.createIncidente(dataToSend).subscribe({
      next: (response) => {
        alert(response.mensaje || 'Incidente creado exitosamente.');
        this.router.navigate(['/main/incidentes']); 
      },
      error: (err) => console.error('Error al crear incidente:', err)
    });
  }

  regresar(): void {
    this.router.navigate(['/main/incidentes']);
  }
}