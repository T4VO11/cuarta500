import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth'; // Tu servicio

@Component({
  selector: 'app-dashboard-redirect',
  template: '', // No tiene vista visual
})
export class DashboardRedirectComponent implements OnInit {

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const role = this.auth.getRole(); // El método que creamos antes

    if (role === 'administrador') {
      this.router.navigate(['/main/dashboard-admin']);
    } else if (role === 'guardia') {
      this.router.navigate(['/main/panel-guardia']);
    } else if (role === 'dueño') {
      this.router.navigate(['/main/home-residente']);
    } else {
      // Si no tiene rol, sácalo
      this.router.navigate(['/login/index']);
    }
  }
}