import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConsumoDiario {
  idConsumo?: number;
  pacienteEmail: string;
  fecha: string;
  tiempoComida: string;
  productoCodigo?: string | null;
  idReceta?: number | null;
  cantidad: number;
  producto?: { descripcion: string; energiaKcal: number };
  receta?: { nombreReceta: string; caloriasToTales: number };
}

export interface ResumenComida {
  tiempoComida: string;
  items: { idConsumo: number; nombre: string; cantidad: number; calorias: number }[];
  totalCalorias: number;
}

@Injectable({ providedIn: 'root' })
export class ConsumoService {
  private apiUrl = `${environment.sqlApiUrl}/consumodiario`;
  // private apiUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/consumodiario';

  constructor(private http: HttpClient) {}

  getResumenDia(email: string, fecha: string): Observable<ResumenComida[]> {
    return this.http.get<ResumenComida[]>(
      `${this.apiUrl}/resumen?pacienteEmail=${encodeURIComponent(email)}&fecha=${fecha}`
    );
  }

  registrarConsumo(consumo: ConsumoDiario): Observable<any> {
    return this.http.post(this.apiUrl, consumo);
  }

  eliminarConsumo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
