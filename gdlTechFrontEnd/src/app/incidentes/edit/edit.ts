import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { IncidenteService } from '../../services/incidente'; 

@Component({
  selector: 'app-incidentes-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './edit.html',
  styleUrl: './edit.css',
})
export class EditComponent implements OnInit {

  private incidenteService = inject(IncidenteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  incidenteId: string | null = null;
  
  // Objeto de formulario que se cargará y se enviará
  incidenteForm: any = {
    _id: '',
    incidente_id: null,
    asunto: '',
    numeroCasa: null,
    categoria: '',
    descripcion: '',
    estado: '',
    usuario_id: null, 
    nombre_reporta: '', 
    fecha_reporte: '',
    fecha_ultima_actualizacion: ''
  };

  categorias = ['Mantenimiento', 'Seguridad', 'Vandalismo', 'Quejas', 'Otro'];
  estados = ['reportado', 'abierto', 'en_proceso', 'resuelto', 'cerrado'];
  isSaving: boolean = false;


  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.incidenteId = params.get('id');
      if (this.incidenteId) {
        this.loadIncidente(this.incidenteId);
      } else {
        this.router.navigate(['/main/incidentes']);
      }
    });
  }

  loadIncidente(id: string): void {
    this.incidenteService.getIncidente(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito' && response.data) {
          const data = response.data;
          
          // Mapear los datos al formulario para edición
          this.incidenteForm = {
            ...data,
            // El usuario_id debe ser un número para enviarse
            usuario_id: Number(data.usuario_id), 
            numeroCasa: Number(data.numeroCasa),
            _id: data._id, 
            // Mapear el 'nombre' que me pasaste de la BD al campo 'nombre_reporta'
            nombre_reporta: data.nombre || 'ID: ' + data.usuario_id, 
            fecha_reporte: data.fecha_reporte ? data.fecha_reporte.substring(0, 10) : '',
            fecha_ultima_actualizacion: data.fecha_ultima_actualizacion ? data.fecha_ultima_actualizacion.substring(0, 10) : '',
          };
        } else {
          alert('Incidente no encontrado.');
          this.router.navigate(['/main/incidentes']);
        }
      },
      error: (err) => {
        console.error('Error al cargar incidente:', err);
        this.router.navigate(['/main/incidentes']);
      }
    });
  }


  // Envía los datos actualizados
  submitUpdate(form: any): void {
    if (form.invalid || !this.incidenteId) {
      alert('Por favor, completa los campos requeridos.');
      return;
    }
    
    this.isSaving = true;

    //  Asegurar que usuario_id sea un número, y que el campo nombre_reporta NO se envíe al Back-End
    const dataToSend = {
        ...this.incidenteForm,
        usuario_id: Number(this.incidenteForm.usuario_id), // Enviamos el ID numérico que Express Validator requiere
        numeroCasa: Number(this.incidenteForm.numeroCasa),
        
        // Eliminamos campos que no están en el modelo de la BD
        nombre_reporta: undefined, 
        _id: undefined, 
    };

    this.incidenteService.updateIncidente(this.incidenteId, dataToSend).subscribe({
      next: (response) => {
        this.isSaving = false;
        alert(response.mensaje || 'Incidente actualizado exitosamente.');
        this.router.navigate(['/main/incidentes/', this.incidenteId]);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error al actualizar incidente:', err);
        // Mostrar el mensaje de error de validación de Express
        alert('Error al actualizar: ' + (err.error?.mensaje || 'Error de conexión.'));
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/main/incidentes']);
  }
}