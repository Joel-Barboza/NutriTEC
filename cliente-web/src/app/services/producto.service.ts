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
  // private apiUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/producto';

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
}
