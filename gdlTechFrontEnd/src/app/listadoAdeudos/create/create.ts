import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { AdeudoService } from '../../services/listado-adeudo'; 

@Component({
  selector: 'app-adeudos-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class ListadoAdeudosCreateComponent {
  
  private adeudoService = inject(AdeudoService);
  private router = inject(Router);
  
  // Objeto para el formulario (datos mínimos requeridos al usuario)
  pagoForm: any = {
    nombre: '', 
    numero_casa: '', 
    periodo_cubierto: this.getDefaultPeriodo(), 
    usuario_id: '2', // ID de usuario fijo para simulación
  };
  
  isLoading: boolean = false;

  // Campos fijos requeridos por el Back-End que DEBEN ser números o strings no vacíos
  // (Aunque tu HTML no los pida, los mandamos en el payload)
  DEFAULT_DATA = {
    tipo_registro: 'pago_mantenimiento',
    monto_base: 1000,
    fecha_limite_pago: '2025-12-31T00:00:00Z', // Valor fijo para pasar la validación
  };


  // Calcula el periodo por defecto (Mes y Año actual)
  getDefaultPeriodo(): string {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1; // getMonth() es 0-indexado
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    return `${year}-${monthStr}`;
  }

  // Envía el formulario (Simular Pago)
  submitPago(form: any): void {
    if (form.invalid) {
      alert('Por favor, llena todos los campos obligatorios.');
      return;
    }
    
    this.isLoading = true;
    
    // 🚨 DATOS QUE DEBEN PASAR VALIDACIÓN
    const dataToSend = {
        // Datos de validación obligatorios
        transaccion_id: String(Math.floor(Math.random() * 900000) + 100000), // 🚨 CLAVE: transaccion_id debe ser string
        tipo_registro: this.DEFAULT_DATA.tipo_registro,
        usuario_id: Number(this.pagoForm.usuario_id), // 🚨 CLAVE: usuario_id debe ser número
        periodo_cubierto: this.pagoForm.periodo_cubierto,
        monto_base: this.DEFAULT_DATA.monto_base,
        fecha_limite_pago: this.DEFAULT_DATA.fecha_limite_pago,
        
        // Datos del formulario
        nombre: this.pagoForm.nombre,
        numero_casa: String(this.pagoForm.numero_casa), 
        
        // Datos transaccionales
        condominio_id: 'C500',
        monto_total_pagado: 1000,
        estado: 'confirmado',
        fecha_pago: new Date().toISOString(),
        pasarela_pago: {
            nombre: 'simulado', 
            numero_transaccion: 'SIM-' + Date.now(),
        },
    };

    this.adeudoService.createPago(dataToSend).subscribe({
      next: (response) => {
        this.isLoading = false;
        alert(response.mensaje || '¡Pago de mantenimiento simulado exitosamente!');
        this.router.navigate(['/main/adeudos']); // Redirigir al índice
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al simular pago:', err);
        // Muestra el mensaje de error de validación de Express
        alert('Error al simular pago: ' + (err.error?.mensaje || 'Error de validación'));
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/main/adeudos']);
  }
}