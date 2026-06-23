import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecetaDetalle {
  idRecetaDetalle?: number;
  idReceta?: number;
  productoCodigo: string;
  cantidadPorciones: number;
  producto?: { descripcion: string; energiaKcal: number };
}

export interface Receta {
  idReceta?: number;
  nombreReceta: string;
  creadoPorEmail: string;
  caloriasToTales?: number;
  carbohidratosTotales?: number;
  proteinasTotales?: number;
  grasasTotales?: number;
  detalles?: RecetaDetalle[];
}

export interface RecetaCreateDto {
  nombreReceta: string;
  creadoPorEmail: string;
  ingredientes: { productoCodigo: string; cantidadPorciones: number }[];
}

@Injectable({ providedIn: 'root' })
export class RecetaService {
  private apiUrl = `${environment.sqlApiUrl}/receta`;
  // private apiUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/receta';

  constructor(private http: HttpClient) {}

  getRecetasPorPaciente(email: string): Observable<Receta[]> {
    return this.http.get<Receta[]>(`${this.apiUrl}?email=${encodeURIComponent(email)}`);
  }

  getRecetaPorId(id: number): Observable<Receta> {
    return this.http.get<Receta>(`${this.apiUrl}/${id}`);
  }

  crearReceta(dto: RecetaCreateDto): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  actualizarReceta(id: number, dto: RecetaCreateDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dto);
  }

  eliminarReceta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
