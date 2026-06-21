import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
// import { FeedBackComponent } from './components/feedback/feedback.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';
// import { ProductosComponent } from './components/productos/productos.component';
import { PendientesComponent } from './components/pendientes/pendientes.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [

      { path: 'pendientes', component: PendientesComponent },
      // { path: 'productos', component: ProductosComponent },
      { path: '', redirectTo: 'pendientes', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
