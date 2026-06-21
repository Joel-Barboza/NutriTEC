import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegistroMedidas {
  idRegistro?: number;
  pacienteEmail: string;
  fecha: string;
  cintura: number;
  cuello: number;
  caderas: number;
  porcentajeMusculo: number;
  porcentajeGrasa: number;
}

@Injectable({ providedIn: 'root' })
export class MedidasService {
  // private apiUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/registromedidas';
  private apiUrl = `${environment.sqlApiUrl}/registromedidas`;

  constructor(private http: HttpClient) {}

  getMedidasPorPaciente(email: string): Observable<RegistroMedidas[]> {
    return this.http.get<RegistroMedidas[]>(`${this.apiUrl}?pacienteEmail=${encodeURIComponent(email)}`);
  }

  getMedidasPorRango(email: string, inicio: string, fin: string): Observable<RegistroMedidas[]> {
    return this.http.get<RegistroMedidas[]>(
      `${this.apiUrl}/rango?pacienteEmail=${encodeURIComponent(email)}&inicio=${inicio}&fin=${fin}`
    );
  }

  registrarMedidas(medidas: RegistroMedidas): Observable<any> {
    return this.http.post(this.apiUrl, medidas);
  }

  actualizarMedidas(id: number, medidas: RegistroMedidas): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, medidas);
  }

  eliminarMedidas(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
