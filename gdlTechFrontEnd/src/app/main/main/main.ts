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

  //roles
  userRole: string | null = null;
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.userRole = this.authService.getRole();
  }
  
  // FUNCIÓN PARA LA PRESENTACIÓN DE LOGOUT 
  cerrarSesion(): void {
        this.authService.logout().subscribe({
    });
  }

  get isAdmin(): boolean {
    return this.userRole === 'administrador';
  }

  get isDueno(): boolean {
    return this.userRole === 'dueño';
  }

  get isAdminOrDueno(): boolean {
    return this.userRole === 'administrador' || this.userRole === 'dueño';
  }

  get isAdminOrGuardia(): boolean {
    return this.userRole === 'administrador' || this.userRole === 'guardia';
  }

  get isAnyRole(): boolean {
    return this.userRole === 'administrador' || this.userRole === 'dueño' || this.userRole === 'guardia';
  }
}