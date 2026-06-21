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
export class PendientesService {
  private apiUrl = `${environment.sqlApiUrl}/producto`;
  // private apiUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/producto';
    // private apiUrl = 'https://localhost:7249/api/producto';

  constructor(private http: HttpClient) {}

  getPendientes(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/pendientes`);
  }

  // buscar(termino: string): Observable<Producto[]> {
  //   return this.http.get<Producto[]>(`${this.apiUrl}/buscar?termino=${encodeURIComponent(termino)}`);
  // }

  crear(producto: Producto): Observable<any> {
    return this.http.post(this.apiUrl, producto);
  }

  aprobar(codigoBarras: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${codigoBarras}/aprobar`, {});
  }

  rechazar(codigoBarras: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${codigoBarras}`);
  }
}