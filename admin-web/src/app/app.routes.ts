import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';
import { PendientesComponent } from './components/pendientes/pendientes.component';
import { ReporteCobroComponent } from './components/reporte-cobro/reporte-cobro.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: 'pendientes', component: PendientesComponent },
      { path: 'reporte-cobro', component: ReporteCobroComponent },
      { path: '', redirectTo: 'pendientes', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
