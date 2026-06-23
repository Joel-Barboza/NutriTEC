import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConsumoItem {
  idConsumo: number;
  nombre: string;
  cantidad: number;
  calorias: number;
}

export interface ConsumoResumen {
  tiempoComida: string;
  items: ConsumoItem[];
  totalCalorias: number;
}

export interface PlanAsignadoItem {
  idPlanDetalle: number;
  productoCodigo: string;
  nombre: string;
  porciones: number;
  calorias: number;
  energiaKcal: number;
  tamanoPorcion: number;
  unidadMedida: string;
}

export interface PlanAsignadoTiempo {
  tiempoComida: string;
  totalCalorias: number;
  items: PlanAsignadoItem[];
}

export interface PlanAsignado {
  idAsignacion: number;
  pacienteEmail: string;
  nutricionistaCodigo: string;
  idPlan: number;
  nombrePlan: string;
  caloriasTotales: number;
  fechaInicio: string;
  fechaFin: string;
  fechaAsignacion: string;
  detallesPorTiempo: PlanAsignadoTiempo[];
}

export interface RespuestaFeedback {
  autor: 'Nutricionista' | 'Paciente' | string;
  mensaje: string;
  fecha: string;
}

export interface Retroalimentacion {
  id: string;
  pacienteId: string;
  nutricionistaId: string;
  tituloHilo: string;
  mensajeInicial: string;
  fechaConsumo?: string | null;
  fechaCreacion: string;
  fechaUltimaActualizacion?: string | null;
  conversacion: RespuestaFeedback[];
}

export interface CrearRetroalimentacionRequest {
  pacienteId: string;
  nutricionistaId: string;
  tituloHilo: string;
  mensajeInicial: string;
  fechaConsumo?: string | null;
}

export interface AgregarRespuestaRequest {
  autor: 'Nutricionista' | 'Paciente';
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  private consumoUrl = `${environment.sqlApiUrl}/consumodiario`;
  private planPacienteUrl = `${environment.sqlApiUrl}/planpaciente`;
  private feedbackUrl = `${environment.mongoApiUrl}/feedback`;

  constructor(private http: HttpClient) {}

  pingMongo(): Observable<unknown> {
    return this.http.get(`${this.feedbackUrl}/ping`);
  }

  getResumenConsumo(pacienteEmail: string, fecha: string): Observable<ConsumoResumen[]> {
    const params = new HttpParams()
      .set('pacienteEmail', pacienteEmail)
      .set('fecha', fecha);

    return this.http.get<ConsumoResumen[]>(`${this.consumoUrl}/resumen`, { params });
  }

  getPlanesAsignados(
    pacienteEmail: string,
    codigoNutricionista: string,
    fecha: string
  ): Observable<PlanAsignado[]> {
    const params = new HttpParams()
      .set('pacienteEmail', pacienteEmail)
      .set('codigo', codigoNutricionista)
      .set('fecha', fecha);

    return this.http.get<PlanAsignado[]>(`${this.planPacienteUrl}/activo`, { params });
  }

  getHilosPacienteNutricionista(
    pacienteEmail: string,
    codigoNutricionista: string
  ): Observable<Retroalimentacion[]> {
    // Se usa GET /api/feedback porque esa ruta ya existía desde el sample original.
    // Luego se filtra en Angular para no depender de una ruta nueva solo para listar.
    const pacienteNormalizado = pacienteEmail.trim().toLowerCase();
    const nutricionistaNormalizado = codigoNutricionista.trim().toLowerCase();

    return this.http.get<Retroalimentacion[]>(this.feedbackUrl).pipe(
      map((hilos) =>
        (hilos ?? [])
          .filter((hilo) =>
            (hilo.pacienteId ?? '').trim().toLowerCase() === pacienteNormalizado &&
            (hilo.nutricionistaId ?? '').trim().toLowerCase() === nutricionistaNormalizado
          )
          .map((hilo) => this.normalizarHilo(hilo))
          .sort((a, b) => {
            const fechaA = new Date(a.fechaUltimaActualizacion || a.fechaCreacion || 0).getTime();
            const fechaB = new Date(b.fechaUltimaActualizacion || b.fechaCreacion || 0).getTime();
            return fechaB - fechaA;
          })
      )
    );
  }

  crearRetroalimentacion(request: CrearRetroalimentacionRequest): Observable<Retroalimentacion> {
    return this.http.post<Retroalimentacion>(this.feedbackUrl, request).pipe(
      map((hilo) => this.normalizarHilo(hilo))
    );
  }

  agregarRespuesta(idHilo: string, request: AgregarRespuestaRequest): Observable<Retroalimentacion> {
    return this.http.post<Retroalimentacion>(
      `${this.feedbackUrl}/${encodeURIComponent(idHilo)}/respuesta`,
      request
    ).pipe(
      map((hilo) => this.normalizarHilo(hilo))
    );
  }

  private normalizarHilo(hilo: Retroalimentacion): Retroalimentacion {
    const conversacion = hilo.conversacion && hilo.conversacion.length > 0
      ? hilo.conversacion
      : hilo.mensajeInicial
        ? [{ autor: 'Nutricionista', mensaje: hilo.mensajeInicial, fecha: hilo.fechaCreacion }]
        : [];

    return {
      ...hilo,
      conversacion
    };
  }
}
