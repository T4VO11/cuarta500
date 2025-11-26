import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReservacionService } from '../../services/reservacion'; 
import { AmenidadService } from '../../services/amenidad'; // Necesario para obtener datos de Amenidad

@Component({
  selector: 'app-reservaciones-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './edit.html',
  styleUrl: './edit.css',
})
export class EditComponent implements OnInit {

  private reservacionService = inject(ReservacionService);
  private amenidadService = inject(AmenidadService); 
  private route = inject(ActivatedRoute); 
  private router = inject(Router);

  reservacionId: string | null = null;
  
  // Estructura de datos que se va a editar
  reservacionAEditar: any = {
    nombre_residente: '',
    telefono: '',
    fecha_evento: '', 
    estado_pago: 'pendiente', // Por defecto en edición
    estado: 'confirmada',
    servicios_extra: [],
    // El total y amenidad_id se calculan o se obtienen, no se editan directamente
    amenidad_id: '',
    total: 1000.00 // Costo base (se recalcula)
  };

  // Datos de apoyo para el formulario (copiado de create.ts)
  amenidad: any = null;
  opcionesExtra = [
    { nombre: '3 mesas y 15 sillas extra', costo: 150, selected: false },
    { nombre: 'Bocina y micrófono', costo: 100, selected: false },
    { nombre: 'Asador grande', costo: 50, selected: false }
  ];
  costoBaseFijo: number = 1000.00;


  ngOnInit(): void {
    // 1. Obtener el ID de la URL y cargar la reservación
    this.route.paramMap.subscribe(params => {
      this.reservacionId = params.get('id');
      if (this.reservacionId) {
        this.loadReservacion(this.reservacionId);
      } else {
        alert('ID de reservación no encontrado.');
        this.router.navigate(['/main/reservaciones']);
      }
    });
  }
  
  // Carga los datos de la reservación existente
  loadReservacion(id: string): void {
    this.reservacionService.getReservacion(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito' && response.data) {
          const data = response.data;
          
          // Mapear los datos de la API al modelo de edición
          this.reservacionAEditar = {
            ...data,
            // Formatear la fecha a 'YYYY-MM-DD' para el input type="date"
            fecha_evento: data.fecha_evento ? data.fecha_evento.substring(0, 10) : '',
          };
          
          // Sincronizar los servicios extra con el modelo
          this.syncServiciosExtra(this.reservacionAEditar.servicios_extra);

          // Cargar Amenidad para mostrar su nombre
          this.loadAmenidadDetalle(data.amenidad_id);
          this.calcularTotal();

        } else {
          alert('Error al cargar la reservación.');
          this.router.navigate(['/main/reservaciones']);
        }
      },
      error: (err) => {
        console.error('Error al cargar reservación para edición:', err);
        alert('Error de conexión.');
        this.router.navigate(['/main/reservaciones']);
      }
    });
  }
  
  // Carga Amenidad (para mostrar el nombre)
  loadAmenidadDetalle(amenidadId: string): void {
    this.amenidadService.getAmenidades().subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.amenidad = response.data;
        }
      },
      error: (err) => console.error('Error al cargar Amenidad:', err)
    });
  }

  // Sincroniza las opciones extra marcadas
  syncServiciosExtra(serviciosExistentes: any[]): void {
    this.opcionesExtra.forEach(opcion => {
      // Si el servicio existe en los datos cargados, lo marcamos como seleccionado
      opcion.selected = serviciosExistentes.some(s => s.nombre === opcion.nombre);
    });
  }

  // Calcula el total basado en los servicios seleccionados
  calcularTotal(): void {
    let subtotal = this.costoBaseFijo;
    this.reservacionAEditar.servicios_extra = [];

    this.opcionesExtra.forEach(opcion => {
      if (opcion.selected) {
        subtotal += opcion.costo;
        // Agregar al array de servicios que se enviará al backend
        this.reservacionAEditar.servicios_extra.push({
          nombre: opcion.nombre,
          costo: opcion.costo
        });
      }
    });

    this.reservacionAEditar.total = subtotal;
  }


  // Envía los datos actualizados
  submitUpdate(form: any): void {
    if (form.invalid || !this.reservacionId) {
      alert('Por favor, completa los campos requeridos y verifica el ID.');
      return;
    }

    // 1. Asegurar la fecha en formato ISO
    const dataToSend = {
      ...this.reservacionAEditar,
      fecha_evento: new Date(this.reservacionAEditar.fecha_evento).toISOString(),
    };
    
    // 2. Llamar al servicio de actualización
    this.reservacionService.updateReservacion(this.reservacionId, dataToSend).subscribe({
      next: (response) => {
        alert(response.mensaje || 'Reservación actualizada exitosamente.');
        // Redirigir a la vista de detalle
        this.router.navigate(['/main/reservaciones/show', this.reservacionId]);
      },
      error: (err) => {
        console.error('Error al actualizar reservación:', err);
        alert('Error al actualizar la reservación. Intenta de nuevo.');
      }
    });
  }

  // Regresar a la vista de detalle
 regresar(): void {
    this.router.navigate(['/main/reservaciones']);
  }
}