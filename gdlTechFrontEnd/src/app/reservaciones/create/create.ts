import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AmenidadService } from '../../services/amenidad'; 
import { ReservacionService } from '../../services/reservacion'; 

@Component({
  selector: 'app-amenidades-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class CreateComponent implements OnInit {

  private amenidadService = inject(AmenidadService); 
  private reservacionService = inject(ReservacionService);
  private route = inject(ActivatedRoute); // Para leer la URL
  private router = inject(Router);
  
  // Modos de la vista
  isReservacionMode: boolean = false;
  amenidad: any = null; // Datos de la amenidad (Terraza)
  ticketData: any = null; // Datos para mostrar el ticket de éxito
  
  // Opciones de servicios extra y su costo base fijo
  opcionesExtra: any[] = [];
  
  // Costo base inicial de la reservación (fijo en 1000 MXN)
  COSTO_BASE = 0;

  // Objeto para el formulario de reservación (el que se envía a MongoDB)
  nuevaReservacion: any = {
    nombre_residente: '',
    telefono: '',
    fecha_evento: '',
    servicios_extra: [], // Array de objetos de servicio seleccionados
    // Valores iniciales
    total: this.COSTO_BASE, // Inicia en 1000 MXN
    estado: 'confirmada',
    estado_pago: 'pendiente',
    // Generar un ID temporal para la reservación (se sobrescribe con el de MongoDB)
    reservacion_id: Math.floor(Math.random() * 10000) + 100 
  };
  
  // Variables de formularios generales (solo se usan en el modo CREATE Amenidad normal)
  nuevaAmenidad: any = {};
  imagenPerfilFile: File | null = null;
  imagenIneFile: File | null = null;

  ngOnInit(): void {
    // 1. Revisa si hay un parámetro 'id' en la URL y si la ruta contiene '/reservar/'
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      
      if (id && this.router.url.includes('/reservar/')) {
        this.isReservacionMode = true;
        this.loadAmenidad(id); // Carga los datos de la Terraza
      }
      // Si no, la vista está en modo CREATE Amenidad normal
    });
  }

  // Carga los datos de la amenidad específica
  loadAmenidad(id: string): void {
    this.amenidadService.showAmenidad(id).subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.amenidad = response.data;

          console.log('Amenidad cargada:', this.amenidad);
          console.log('Reglas:', this.amenidad.reglas_apartado);
          console.log('Extras:', this.amenidad.reglas_apartado?.extras_disponibles);
          //CAMBIO: Mapeo de datos del Backend al Frontend ---
          
          // Asignar el costo base desde la BD
          // Usamos el operador ?. para evitar errores si viene nulo
          this.COSTO_BASE = this.amenidad.reglas_apartado?.costo_apartado || 0;
          
          // Asignar los extras disponibles desde la BD
          const extrasData = this.amenidad.reglas_apartado?.extras_disponibles || [];
          this.opcionesExtra = extrasData.map((extra: any) => ({
          ...extra,
          selected: false
  }));

          // Reinicia el total usando el nuevo costo base real
          this.nuevaReservacion.total = this.COSTO_BASE;
        }
      },
      error: (err) => {
        console.error('Error al cargar la amenidad para reservar:', err);
        alert('No se pudo cargar la amenidad. Intenta más tarde.');
        this.regresar();
      }
    });
  }
  
  // Maneja la selección de servicios extra (checkboxes)
  toggleServicioExtra(servicio: any, isChecked: boolean): void {
    if (isChecked) {
      // Agrega el servicio y suma el costo
      this.nuevaReservacion.servicios_extra.push({
          nombre: servicio.nombre, 
          costo: servicio.costo
      });
      this.nuevaReservacion.total += servicio.costo;
    } else {
      // Remueve el servicio y resta el costo
      const index = this.nuevaReservacion.servicios_extra.findIndex((s: any) => s.nombre === servicio.nombre);
      if (index > -1) {
        this.nuevaReservacion.total -= servicio.costo;
        this.nuevaReservacion.servicios_extra.splice(index, 1);
      }
    }
  }

  // Guardar Reservación o Crear Amenidad
  onSubmit(form: any): void {
    if (form.invalid) {
      alert('Por favor, completa los campos requeridos.');
      return;
    }
    
    if (this.isReservacionMode) {
      this.handleReservacionSubmit();
    } else {
      // Lógica de la actividad normal de crear amenidades
      alert('Modo Crear Amenidad no implementado en esta pantalla, solo Reservación.'); 
    }
  }

  // 1. Lógica para crear una RESERVACIÓN (Llama al ReservacionService)
  handleReservacionSubmit(): void {
    const dataToSend = {
      ...this.nuevaReservacion,
      // Asegurar que la fecha sea válida
      fecha_evento: this.nuevaReservacion.fecha_evento ? new Date(this.nuevaReservacion.fecha_evento).toISOString() : new Date().toISOString(),
    };
    
    this.reservacionService.createReservacion(dataToSend).subscribe({
      next: (response) => {
        // Almacenar datos para mostrar el ticket y salir del modo formulario
        this.ticketData = response.data; 
        this.isReservacionMode = false; // Muestra el ticket de éxito
      },
      error: (err) => {
        console.error('Error al crear reservación:', err);
        alert('Error al guardar la reservación. Intenta de nuevo.');
      }
    });
  }
  
  // Regresar a la vista de lista de amenidades
  regresar(): void {
    this.router.navigate(['/main/amenidades']);
  }

  // El resto de funciones (onFileSelected, submitAmenidadForm) se dejarán vacías 
  // ya que la prioridad es la funcionalidad de Reservación.
}