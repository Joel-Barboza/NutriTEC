import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlanPaciente {
  idAsignacion?: number;
  pacienteEmail: string;
  idPlan: number;
  nutricionistaCodigo: string;
  fechaInicio: string;
  fechaFin: string;
  fechaAsignacion?: string;
  paciente?: any;
  planAlimentacion?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PlanPacienteService {
  private apiUrl = 'http://localhost:5274/api/PlanPaciente';

  constructor(private http: HttpClient) {}

  getAsignaciones(codigo: string): Observable<PlanPaciente[]> {
    return this.http.get<PlanPaciente[]>(`${this.apiUrl}?codigo=${codigo}`);
  }

  asignarPlan(asignacion: PlanPaciente): Observable<any> {
    return this.http.post(this.apiUrl, asignacion);
  }

  eliminarAsignacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}