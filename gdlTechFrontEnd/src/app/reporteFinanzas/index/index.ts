import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; 
import { ReporteFinanzaService } from '../../services/reporte-finanza'; 
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reporteFinanzas-index',
  standalone: true,
  //  Imports necesarios para el filtro
  imports: [CommonModule, RouterModule, FormsModule, DatePipe], 
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class ReporteFinanzasIndexComponent implements OnInit {

  //roles
  userRole: string | null = null;
  
  
  private reporteFinanzaService = inject(ReporteFinanzaService); 
  private router = inject(Router);

  //  DATOS PARA EL CÁLCULO Y FILTRO
  allReports: any[] = []; // Todos los reportes recibidos del API
  filteredReports: any[] = []; // Reportes mostrados en la tabla
  totalEgresos: number = 0; // Total acumulado de egresos
  
  selectedPeriod: string; // YYYY-MM (para el input type="month")
  isLoading: boolean = true;
  
  constructor(private authService: AuthService) {
    // Inicializar el filtro al mes actual
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    this.selectedPeriod = `${year}-${monthStr}`;
  }

  ngOnInit(): void {
    this.loadReportes();
    this.userRole = this.authService.getRole();
  }

  // 1. LEER (Obtiene todos los reportes de egresos)
  loadReportes(): void {
    this.isLoading = true;
    this.reporteFinanzaService.getReportes().subscribe({
      next: (response) => {
        if (response && response.estado === 'exito') {
          this.allReports = response.data;
          // Filtrar y calcular el total inicial
          this.filterAndCalculate();
        } 
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener reportes:', err);
        this.isLoading = false;
      }
    });
  }

  // 2. FUNCIÓN DE FILTRO Y CÁLCULO (Se llama al cambiar el mes)
  filterAndCalculate(): void {
    if (!this.selectedPeriod) {
        this.filteredReports = this.allReports;
    } else {
        const [year, month] = this.selectedPeriod.split('-');
        
        // Filtrar por el año y mes de la fecha del reporte
        this.filteredReports = this.allReports.filter(reporte => {
            const reporteDate = new Date(reporte.fecha);
            // Compara año y mes
            return reporteDate.getFullYear() === Number(year) && 
                   reporteDate.getMonth() + 1 === Number(month);
        });
    }
    
    // Calcular el total de egresos de los reportes filtrados
    this.calculateTotal(this.filteredReports);
  }

  // 3. FUNCIÓN DE CÁLCULO DE TOTAL
  calculateTotal(data: any[]): void {
    this.totalEgresos = data.reduce((sum, reporte) => {
        const monto = parseFloat(reporte.monto);
        return sum + (isNaN(monto) ? 0 : monto);
    }, 0);
  }
  
  // 4. GENERAR REPORTE (Exportar a CSV)
  generateReport(): void {
    if (this.filteredReports.length === 0) {
        alert('No hay egresos para generar el reporte en este período.');
        return;
    }
    
    const periodName = this.selectedPeriod || 'Todos';
    const filename = `Reporte_Egresos_${periodName}_C500.csv`;

    //  Encabezados (Keys) para el archivo CSV
    const headers = ['Reporte ID', 'Concepto', 'Monto', 'Categoría', 'Fecha Gasto', 'Usuario ID', 'Descripción'];
    
    //  Convertir JSON a filas CSV
    const rows = this.filteredReports.map(reporte => [
        reporte.reporte_id,
        reporte.concepto,
        reporte.monto,
        reporte.categoria,
        new Date(reporte.fecha).toLocaleDateString('es-MX'),
        reporte.usuario_id,
        `"${reporte.descripcion.replace(/"/g, '""')}"` // Envuelve la descripción en comillas para manejar comas
    ]);

    //  Unir encabezados y filas
    const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(','))
    ].join('\n');

    //  Crear un Blob y forzar la descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) { 
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert(` Reporte de egresos para el período ${periodName} generado exitosamente!`);
    }
  }

  // 5. Borrar y Navegación
  deleteReporte(id: string): void {
    if (confirm(`¿Estás seguro de eliminar el reporte ${id}?`)) {
      this.reporteFinanzaService.deleteReporte(id).subscribe({
        next: (response) => {
          alert(response.mensaje || 'Reporte eliminado exitosamente.');
          this.loadReportes(); // Recarga la lista
        },
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }

  get isAdmin(): boolean {
    return this.userRole === 'administrador';
  }
}