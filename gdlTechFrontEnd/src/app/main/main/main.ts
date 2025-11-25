import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../../services/auth'; 

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterModule, CommonModule], 
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class MainComponent { 
  
  private authService = inject(AuthService);
  
  // FUNCIÓN PARA LA PRESENTACIÓN DE LOGOUT 
  cerrarSesion(): void {
        this.authService.logout().subscribe({
    });
  }
}