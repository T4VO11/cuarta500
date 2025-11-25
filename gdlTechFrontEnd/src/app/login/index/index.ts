import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Necesario para el ngModel en el formulario
import { Router, RouterModule } from '@angular/router'; // Necesario para la navegación
import { CommonModule } from '@angular/common'; // Necesario para *ngIf (mostrar errores)
import { AuthService } from '../../services/auth'; // servicio de autenticación

@Component({
  selector: 'app-login-index',
  standalone: true,
  // Imports necesarios para que el template funcione
  imports: [FormsModule, CommonModule, RouterModule], 
  templateUrl: './index.html',
  styleUrl: './index.css'
})

export class IndexComponent { 
  credentials = {
    username: '', 
    password: ''
  };
  errorMessage: string | null = null;
  
  // Inyección de dependencias
  private authService = inject(AuthService);
  private router = inject(Router);

  
  // Maneja el envío del formulario de login.
   
  onSubmit(): void {
    this.errorMessage = null; // Limpia mensajes anteriores

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        // Si el login es exitoso, el token ya se guardó en el localStorage (ver auth.ts)
        console.log('Login exitoso. Token guardado.', response);
        
        // Redirige al dashboard principal
        this.router.navigate(['/main']); 
      },
      error: (err) => {
        console.error('Error de autenticación o conexión:', err);
        this.errorMessage = 'Credenciales inválidas. Verifica tu usuario y contraseña.';
      }
    });
  }
}