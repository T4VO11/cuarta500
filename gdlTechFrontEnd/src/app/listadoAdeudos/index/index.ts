import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Incluir DatePipe para formatos
import { RouterModule, Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; // Necesario para el input de filtro
import { AdeudoService } from '../../services/listado-adeudo'; 

@Component({
  selector: 'app-adeudos-index',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe], 
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class ListadoAdeudosIndexComponent implements OnInit {

  private adeudoService = inject(AdeudoService); 
  private router = inject(Router);

  // DATOS PARA EL CÁLCULO Y FILTRO
  allAdeudos: any[] = []; // Todos los pagos recibidos del API
  filteredAdeudos: any[] = []; // Pagos mostrados en la tabla
  totalAccumulated: number = 0; // Total acumulado

  selectedPeriod: string; // YYYY-MM (para el input type="month")
  isLoading: boolean = true;
  
  constructor() {
    // Inicializar el filtro al mes actual
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    this.selectedPeriod = `${year}-${monthStr}`;
  }

  ngOnInit(): void {
    this.loadAdeudos();
  }

  // 1. LEER (Obtiene el listado de pagos)
  loadAdeudos(): void {
    this.isLoading = true;
    this.adeudoService.getAdeudos().subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          // Asumimos que el API devuelve todos los pagos
          this.allAdeudos = response.data.filter((d: any) => d.tipo_registro === 'pago_mantenimiento');
          
          // Filtrar y calcular el total inicial
          this.filterAndCalculate();
        } 
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener pagos:', err);
        this.isLoading = false;
      }
    });
  }

  // 2. FUNCIÓN DE FILTRO Y CÁLCULO
  filterAndCalculate(): void {
    if (!this.selectedPeriod) {
        this.filteredAdeudos = this.allAdeudos;
    } else {
        // Filtrar por el periodo cubierto (YYYY-MM)
        this.filteredAdeudos = this.allAdeudos.filter(adeudo => 
            adeudo.periodo_cubierto && adeudo.periodo_cubierto.startsWith(this.selectedPeriod)
        );
    }
    
    // Calcular el total de los pagos filtrados
    this.calculateTotal(this.filteredAdeudos);
  }

  // 3. FUNCIÓN DE ACUMULACIÓN
  calculateTotal(data: any[]): void {
    this.totalAccumulated = data.reduce((sum, adeudo) => {
        // Asegurarse de que el monto sea un número antes de sumar
        const monto = parseFloat(adeudo.monto_total_pagado);
        return sum + (isNaN(monto) ? 0 : monto);
    }, 0);
  }
  
  // Navegación al formulario de pago
  goToPaymentForm(): void {
    this.router.navigate(['/main/adeudos/create']);
  }
}