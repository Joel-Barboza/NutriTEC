import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

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

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly feedbackUrl = `${environment.mongoApiUrl}/feedback`;
  private readonly timeoutMs = 10000;

  constructor(private http: HttpClient) {}

  getHilosPaciente(pacienteEmail: string): Observable<Retroalimentacion[]> {
    const emailNormalizado = this.normalizarTexto(pacienteEmail);
    const pacienteUrl = `${this.feedbackUrl}/paciente/${encodeURIComponent(pacienteEmail)}`;

    return this.http.get<any>(pacienteUrl).pipe(
      timeout(this.timeoutMs),
      catchError((err) => {
        // Compatibilidad con una MongoAPI vieja: si no existe /paciente/{email}, intenta /feedback.
        // Si /feedback también falla con 500/CORS, entonces el problema está en MongoAPI y no en Angular.
        if (err?.status === 404 || err?.status === 405) {
          return this.http.get<any>(this.feedbackUrl).pipe(timeout(this.timeoutMs));
        }

        return throwError(() => err);
      }),
      map((respuesta) => this.normalizarListaRetroalimentaciones(respuesta)),
      map((hilos) =>
        hilos
          .filter((hilo) => this.normalizarTexto(hilo.pacienteId) === emailNormalizado)
          .sort((a, b) => this.fechaOrden(b) - this.fechaOrden(a))
      )
    );
  }

  responderHilo(idHilo: string, mensaje: string): Observable<Retroalimentacion> {
    return this.http.post<any>(
      `${this.feedbackUrl}/${encodeURIComponent(idHilo)}/respuesta`,
      {
        autor: 'Paciente',
        mensaje
      }
    ).pipe(
      timeout(this.timeoutMs),
      map((respuesta) => this.normalizarRetroalimentacion(respuesta))
    );
  }

  private normalizarListaRetroalimentaciones(respuesta: any): Retroalimentacion[] {
    const lista: any[] = Array.isArray(respuesta)
      ? respuesta
      : Array.isArray(respuesta?.$values)
        ? respuesta.$values
        : [];

    return lista.map((item: any) => this.normalizarRetroalimentacion(item));
  }

  private normalizarRetroalimentacion(item: any): Retroalimentacion {
    const conversacionRaw = item?.conversacion ?? item?.Conversacion ?? item?.respuestas ?? item?.Respuestas ?? [];
    const conversacionLista = Array.isArray(conversacionRaw)
      ? conversacionRaw
      : Array.isArray(conversacionRaw?.$values)
        ? conversacionRaw.$values
        : [];

    const mensajeInicial = String(item?.mensajeInicial ?? item?.MensajeInicial ?? '');
    const conversacion = conversacionLista.map((mensaje: any) => ({
      autor: String(mensaje?.autor ?? mensaje?.Autor ?? 'Nutricionista'),
      mensaje: String(mensaje?.mensaje ?? mensaje?.Mensaje ?? ''),
      fecha: String(mensaje?.fecha ?? mensaje?.Fecha ?? new Date().toISOString())
    }));

    // Si el hilo viejo no trae Conversacion pero sí MensajeInicial, igual lo muestra como primer mensaje.
    if (conversacion.length === 0 && mensajeInicial.trim()) {
      conversacion.push({
        autor: 'Nutricionista',
        mensaje: mensajeInicial,
        fecha: String(item?.fechaCreacion ?? item?.FechaCreacion ?? new Date().toISOString())
      });
    }

    return {
      id: String(item?.id ?? item?.Id ?? item?._id ?? ''),
      pacienteId: String(item?.pacienteId ?? item?.PacienteId ?? ''),
      nutricionistaId: String(item?.nutricionistaId ?? item?.NutricionistaId ?? ''),
      tituloHilo: String(item?.tituloHilo ?? item?.TituloHilo ?? 'Seguimiento del nutricionista'),
      mensajeInicial,
      fechaConsumo: item?.fechaConsumo ?? item?.FechaConsumo ?? null,
      fechaCreacion: String(item?.fechaCreacion ?? item?.FechaCreacion ?? new Date().toISOString()),
      fechaUltimaActualizacion: item?.fechaUltimaActualizacion ?? item?.FechaUltimaActualizacion ?? null,
      conversacion
    };
  }

  private normalizarTexto(valor: string): string {
    return (valor ?? '').trim().toLowerCase();
  }

  private fechaOrden(hilo: Retroalimentacion): number {
    const fecha = hilo.fechaUltimaActualizacion || hilo.fechaCreacion;
    const time = new Date(fecha ?? '').getTime();
    return Number.isNaN(time) ? 0 : time;
  }
}
