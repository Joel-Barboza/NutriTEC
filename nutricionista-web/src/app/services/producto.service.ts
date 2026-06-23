import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Producto {
  codigoBarras: string;
  descripcion: string;
  tamanoPorcion: number;
  unidadMedida: string;
  energiaKcal: number;
  grasaG: number;
  sodioMg: number;
  carbohidratosG: number;
  proteinaG: number;
  vitaminas?: string;
  calcioMg: number;
  hierroMg: number;
  aprobadoPorAdministrador: boolean;
  creadoPor: string;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private apiUrl = `${environment.sqlApiUrl}/producto`;

  constructor(private http: HttpClient) {}

  getAprobados(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/aprobados`);
  }

  buscar(termino: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/buscar?termino=${encodeURIComponent(termino)}`);
  }

  crear(producto: Producto): Observable<any> {
    return this.http.post(this.apiUrl, producto);
  }

  actualizar(codigo: string, producto: Producto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${encodeURIComponent(codigo)}`, producto);
  }

  eliminar(codigo: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${encodeURIComponent(codigo)}`);
  }
}