import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { BitacoraService } from '../../services/bitacora'; 

@Component({
  selector: 'app-bitacoras-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class BitacorasCreateComponent {
  
  private bitacoraService = inject(BitacoraService);
  private router = inject(Router);
  
  // Objeto que representa el formulario y el payload de la BD
  bitacoraForm: any = {
    // Campos principales obligatorios
    registro_id: null, 
    tipo_registro: 'visita_no_esperada', 
    accion: 'entrada',
    usuario_id: 1, // ID de usuario fijo por defecto (para pasar la validación isInt)
    
    // CAMPOS ANIDADOS
    detalle_acceso: {
      metodo: 'manual', 
      numeroCasa: null,
      nombre_visitante: '', 
      motivo: '',
    },
    
    // Objeto Vehículo (Se envía completo como JSON al Back-End)
    vehiculo: {
        modelo: '', 
        placas: '',
    },

    // Fecha y hora
    fecha_hora: this.getCurrentDateTimeLocal(),
    condominio_id: 'C500', 
  };
  
  //PROPIEDAD FALTANTE: Almacena el archivo subido
  selectedFileINE: File | null = null; 
  isLoading: boolean = false;

  constructor() {}

  // Helper para obtener la fecha y hora actual en formato YYYY-MM-DDTHH:MM
  getCurrentDateTimeLocal(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000; 
    const localIsoString = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localIsoString;
  }

  // FUNCIÓN CORREGIDA: Captura el archivo del HTML (Resuelve el error 2339)
  onFileSelectedINE(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFileINE = file;
    } else {
      this.selectedFileINE = null;
    }
  }

  // 1. Simulación de la Pluma (Botones Subir/Bajar)
  simularPluma(accion: 'subir' | 'bajar'): void {
    if (accion === 'subir') {
      this.bitacoraForm.accion = 'entrada';
      alert('Pluma Subida: Acceso permitido. Registrando ENTRADA.');
    } else {
      this.bitacoraForm.accion = 'salida';
      alert('Pluma Bajada: Acceso finalizado. Registrando SALIDA.');
    }
    this.bitacoraForm.detalle_acceso.metodo = 'manual_pluma';
  }

  // 2. Envía el formulario (POST)
  submitBitacora(form: any): void {
    if (form.invalid) {
      alert('Por favor, llena todos los campos obligatorios del registro.');
      return;
    }
    
    // Validar archivo de identificación
    if (!this.selectedFileINE) {
        alert('Debes adjuntar la Foto de Identificación (INE/Licencia).');
        return;
    }
    
    this.isLoading = true;
    
    const formData = new FormData();
    
    // 1. Asignar campos principales (Simples y numéricos)
    formData.append('registro_id', String(this.bitacoraForm.registro_id));
    formData.append('usuario_id', String(this.bitacoraForm.usuario_id)); 
    formData.append('tipo_registro', this.bitacoraForm.tipo_registro);
    formData.append('accion', this.bitacoraForm.accion);
    formData.append('condominio_id', this.bitacoraForm.condominio_id);
    formData.append('fecha_hora', new Date(this.bitacoraForm.fecha_hora).toISOString()); 
    
    // 2. Asignar objetos anidados como JSON strings
    const detalleAccesoPayload = {
        metodo: this.bitacoraForm.detalle_acceso.metodo,
        numeroCasa: Number(this.bitacoraForm.detalle_acceso.numeroCasa),
        placas: this.bitacoraForm.vehiculo.placas, // Usamos las placas del objeto vehiculo
        nombre_visitante: this.bitacoraForm.detalle_acceso.nombre_visitante,
        motivo: this.bitacoraForm.detalle_acceso.motivo,
    };
    
    formData.append('detalle_acceso', JSON.stringify(detalleAccesoPayload));
    formData.append('vehiculo', JSON.stringify(this.bitacoraForm.vehiculo));
    
    // 3. Adjuntar el archivo de identificación (INE)
    formData.append('imagen_ine', this.selectedFileINE, this.selectedFileINE.name);


    this.bitacoraService.createBitacora(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        alert(response.mensaje || 'Registro de Bitácora creado exitosamente.');
        this.router.navigate(['/main/bitacoras']); // Regresar al Index
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al registrar Bitácora:', err);
        alert('Error al registrar: ' + (err.error?.mensaje || 'Error de servidor.'));
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/main/bitacoras']);
  }
}