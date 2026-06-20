import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface PacienteBusqueda {
  email: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  nombreCompleto: string;
  paisResidencia: string;
  pesoActual: number;
  imc: number;
  consumoMaxCalorias: number;
  asociadoAlNutricionista: boolean;
  nutricionistaActualCodigo?: string | null;
  fechaAsociacion?: string | null;
}

export interface PacienteAsociado {
  pacienteEmail: string;
  nutricionistaCodigo: string;
  fechaAsociacion: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  nombreCompleto: string;
  paisResidencia: string;
  pesoActual: number;
  imc: number;
  consumoMaxCalorias: number;
}

export interface AsociacionPacienteResponse {
  mensaje: string;
  pacienteEmail: string;
  nutricionistaCodigo: string;
  fechaAsociacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class NutricionistaService {

  // API original de nutricionistas.
  // private apiUrl = 'http://localhost:5274/api/nutricionista';
  private apiUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/nutricionista';

  // API nueva y separada para la asociación paciente-nutricionista.
  // private apiPacienteNutricionistaUrl = 'http://localhost:5274/api/paciente-nutricionista';
  private apiPacienteNutricionistaUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/paciente-nutricionista';

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

  buscarPacientes(codigoNutricionista: string, termino: string): Observable<PacienteBusqueda[]> {
    const params = termino.trim()
      ? new HttpParams().set('termino', termino.trim())
      : new HttpParams();

    return this.http.get<PacienteBusqueda[]>(
      `${this.apiPacienteNutricionistaUrl}/buscar-pacientes/${encodeURIComponent(codigoNutricionista)}`,
      { params }
    );
  }

  getPacientesAsociados(codigoNutricionista: string): Observable<PacienteAsociado[]> {
    return this.http.get<PacienteAsociado[]>(
      `${this.apiPacienteNutricionistaUrl}/pacientes-asociados/${encodeURIComponent(codigoNutricionista)}`
    );
  }

  asociarPaciente(
    codigoNutricionista: string,
    pacienteEmail: string
  ): Observable<AsociacionPacienteResponse> {
    return this.http.post<AsociacionPacienteResponse>(
      `${this.apiPacienteNutricionistaUrl}/asociar`,
      { codigoNutricionista, pacienteEmail }
    );
  }
}
