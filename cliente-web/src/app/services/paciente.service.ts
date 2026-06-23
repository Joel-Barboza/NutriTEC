import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Paciente {
  email: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  fechaNacimiento: string;
  paisResidencia: string;
  pesoInicial: number;
  pesoActual: number;
  imc: number;
  cintura: number;
  cuello: number;
  caderas: number;
  porcentajeMusculo: number;
  porcentajeGrasa: number;
  consumoMaxCalorias: number;
  passwordEncriptado: string;
}

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private apiUrl = `${environment.sqlApiUrl}/paciente`;

  constructor(private http: HttpClient) {}

  getPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.apiUrl);
  }

  getPacienteByEmail(email: string): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.apiUrl}/${encodeURIComponent(email)}`);
  }

  login(email: string, password: string): Observable<Paciente> {
    return this.http.post<Paciente>(`${this.apiUrl}/login`, {
      email,
      password
    });
  }

  crearPaciente(paciente: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, paciente);
  }

  actualizarPaciente(email: string, paciente: Partial<Paciente>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${encodeURIComponent(email)}`, paciente);
  }
}
