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
    usuario_id: null, // ID de usuario fijo para simulación
  };
  
  isLoading: boolean = false;

  // Campos fijos requeridos por el Back-End que DEBEN ser números o strings no vacíos
  // (Aunque tu HTML no los pida, los mandamos en el payload)
  DEFAULT_DATA = {
    tipo_registro: 'pago_mantenimiento',
    monto_base: 1000,
    fecha_limite_pago: '2025-12-31T00:00:00Z', // Valor fijo para pasar la validación
  };

  ngOnInit() {
    // 1. Intentamos buscar el objeto 'usuario' (Plan A)
    const rawUser = localStorage.getItem('usuario');
    
    if (rawUser) {
        const usuarioLogueado = JSON.parse(rawUser);
        if (usuarioLogueado.usuario_id) {
            this.pagoForm.usuario_id = usuarioLogueado.usuario_id;
            // Opcional: Nombre
            if (usuarioLogueado.nombre) {
                 this.pagoForm.nombre = `${usuarioLogueado.nombre} ${usuarioLogueado.apellido_paterno || ''}`;
            }
            return; // ¡Listo, lo encontramos!
        }
    }

    // 2. Si falló el Plan A, intentamos leer del TOKEN (Plan B - El Salvador)
    const token = localStorage.getItem('auth_token');
    if (token) {
        const usuarioIdDelToken = this.obtenerIdDesdeToken(token);
        if (usuarioIdDelToken) {
            this.pagoForm.usuario_id = usuarioIdDelToken;
            console.log('ID recuperado del token:', usuarioIdDelToken);
        }
    }
  }

  // --- FUNCIÓN AUXILIAR PARA LEER EL TOKEN ---
  obtenerIdDesdeToken(token: string): any {
      try {
          const payload = token.split('.')[1];
          const decodedJson = atob(payload);
          const datos = JSON.parse(decodedJson);
          
          // --- CORRECCIÓN BASADA EN TU IMAGEN ---
          // Primero verificamos si existe el objeto 'usuario' dentro del token
          if (datos.usuario && datos.usuario.usuario_id) {
              return datos.usuario.usuario_id; // Retorna 14
          }
          // ---------------------------------------

          // Fallbacks por si acaso
          return datos.usuario_id || datos.id;
      } catch (error) {
          console.error('No se pudo decodificar el token', error);
          return null;
      }
  }


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

    // Validación extra de seguridad
    if (!this.pagoForm.usuario_id) {
        alert('Error: No se pudo identificar tu usuario. Por favor cierra sesión y vuelve a entrar.');
        return;
    }
    
    this.isLoading = true;
    
    // Solo enviamos los datos necesarios para la metadata
    const dataToSend = {
        nombre: this.pagoForm.nombre,
        numero_casa: this.pagoForm.numero_casa,
        periodo_cubierto: this.pagoForm.periodo_cubierto,
        usuario_id: this.pagoForm.usuario_id
    };

    // Llamamos a un servicio nuevo (o agrégalo a tu AdeudoService)
    this.adeudoService.iniciarPagoMantenimiento(dataToSend).subscribe({
      next: (response) => {
        if (response.data && response.data.url) {
            // ¡Vámonos a Stripe!
            window.location.href = response.data.url;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error Stripe:', err);
        alert('No se pudo iniciar el pago.');
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/main/adeudos']);
  }
}