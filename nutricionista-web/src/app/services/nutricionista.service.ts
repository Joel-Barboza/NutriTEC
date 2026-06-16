import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Nutricionista {
  nutricionistaId?: number;

  // Información personal
  cedula: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  codigoNutricionista: string;

  // Datos personales
  fechaNacimiento: string; // ISO (YYYY-MM-DD)

  // Información física
  peso: number;
  imc: number;

  // Contacto
  direccion: string;
  email: string;

  // Autenticación
  passwordEncriptado: string;

  // Fotografía (URL o Base64)
  foto?: string;

  // Cobro
  numeroTarjeta: string;
  tipoCobro: 'SEMANAL' | 'MENSUAL' | 'ANUAL';
}

@Injectable({
  providedIn: 'root'
})
export class NutricionistaService {

  // private apiUrl = 'http://localhost:5274/api/nutricionista';
  private apiUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/nutricionista';

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<Nutricionista[]> {
    return this.http.get<Nutricionista[]>(this.apiUrl);
  }

  crearUsuario(nutricionista: Nutricionista): Observable<Nutricionista> {
    return this.http.post<Nutricionista>(this.apiUrl, nutricionista);
  }

  actualizarUsuario(nutricionista: Nutricionista): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${nutricionista.nutricionistaId}`,
      nutricionista
    );
  }

  eliminarUsuario(nutricionistaId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${nutricionistaId}`
    );
  }
}