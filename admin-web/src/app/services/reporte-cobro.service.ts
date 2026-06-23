import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReporteCobro {
  tipoCobro: string;
  email: string;
  nombreCompleto: string;
  numeroTarjeta: string;
  totalPacientes: number;
  montoTotal: number;
  descuento: number;
  montoACobrar: number;
}

@Injectable({ providedIn: 'root' })
export class ReporteCobroService {
  private apiUrl = `${environment.sqlApiUrl}/reporte-cobro-sp`;

  constructor(private http: HttpClient) {}

  obtenerReporte(): Observable<ReporteCobro[]> {
    // Evita que la pantalla quede pegada indefinidamente si SQL/API no responde.
    return this.http.get<ReporteCobro[]>(this.apiUrl).pipe(
      timeout(12000)
    );
  }
}
