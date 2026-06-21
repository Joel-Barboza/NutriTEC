import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlanDetalle {
  idPlanDetalle?: number;
  idPlan?: number;
  tiempoComida: string;
  productoCodigo: string;
  porciones: number;
  producto?: any;
}

export interface PlanAlimentacion {
  idPlan?: number;
  nombrePlan: string;
  nutricionistaCodigo: string;
  caloriasTotales?: number;
  detalles: PlanDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private apiUrl = `${environment.sqlApiUrl}/plan`;
  // private apiUrl = 'http://localhost:5274/api/plan';

  constructor(private http: HttpClient) {}

  getPlanesPorNutricionista(codigo: string): Observable<PlanAlimentacion[]> {
    return this.http.get<PlanAlimentacion[]>(`${this.apiUrl}?codigo=${codigo}`);
  }

  getPlanPorId(id: number): Observable<PlanAlimentacion> {
    return this.http.get<PlanAlimentacion>(`${this.apiUrl}/${id}`);
  }

  crearPlan(plan: PlanAlimentacion): Observable<any> {
    return this.http.post(this.apiUrl, plan);
  }

  actualizarPlan(id: number, plan: PlanAlimentacion): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, plan);
  }

  eliminarPlan(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}