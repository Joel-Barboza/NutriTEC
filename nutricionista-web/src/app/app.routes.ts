import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FeedBackComponent } from './components/feedback/feedback.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';
import { ProductosComponent } from './components/productos/productos.component';
import { PlanesComponent } from './components/planes/planes.component';
import { PacientesComponent } from './components/pacientes/pacientes.component';
import { AsignarPlanComponent } from './components/asignar-plan/asignar-plan.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: 'feedback', component: FeedBackComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'planes', component: PlanesComponent },
      { path: 'pacientes', component: PacientesComponent },
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
      { path: 'asignar-plan', component: AsignarPlanComponent },
      
    ]
  },
  { path: '**', redirectTo: 'login' }
];
