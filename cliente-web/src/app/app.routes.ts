import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductosComponent } from './components/productos/productos.component';
import { ConsumoDiarioComponent } from './components/consumo-diario/consumo-diario.component';
import { RecetasComponent } from './components/recetas/recetas.component';
import { RegistroMedidasComponent } from './components/registro-medidas/registro-medidas.component';
import { ReporteAvanceComponent } from './components/reporte-avance/reporte-avance.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'consumo-diario', pathMatch: 'full' },
      { path: 'consumo-diario', component: ConsumoDiarioComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'recetas', component: RecetasComponent },
      { path: 'medidas', component: RegistroMedidasComponent },
      { path: 'reporte', component: ReporteAvanceComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
