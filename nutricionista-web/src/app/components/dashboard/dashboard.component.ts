import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Nutricionista } from '../../services/nutricionista.service';
// import { Usuario } from '../../services/usuario.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  menu = [
    { nombre: 'Productos', valor: 'productos' },
    { nombre: 'Pacientes', valor: 'pacientes' },
    { nombre: 'Gestión de Planes', valor: 'planes' },
    { nombre: 'Retroalimentación', valor: 'feedback' },
    { nombre: 'Asignar Plan', valor: 'asignar-plan' },
  ];

  constructor(private router: Router, private authService: AuthService) { }
  // constructor(private router: Router) {}

  get currentUser(): Nutricionista | null {
    return this.authService.currentUser;
  }

  get seccionActual(): string {
    const seg = this.router.url.split('/').pop()?.split('?')[0] || 'productos';
    return this.menu.find(m => m.valor === seg)?.nombre ?? 'Dashboard';
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
