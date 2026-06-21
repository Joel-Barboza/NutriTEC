import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Admin } from '../../services/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  get usuario(): Admin | null {
    return this.auth.currentUser;
  }

  constructor(private auth: AuthService, private router: Router) {}

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
