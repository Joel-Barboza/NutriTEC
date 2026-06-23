import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeoutError, finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { FeedbackService, Retroalimentacion } from '../../services/feedback.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-feedback-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {
  hilos: Retroalimentacion[] = [];
  respuestasPorHilo: { [id: string]: string } = {};

  cargando = false;
  respondiendoId = '';
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private authService: AuthService,
    private feedbackService: FeedbackService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarHilos();
  }

  get pacienteEmail(): string {
    return this.authService.currentUser?.email ?? '';
  }

  cargarHilos(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    const email = this.pacienteEmail;

    if (!email) {
      this.hilos = [];
      this.cargando = false;
      this.mensajeError = 'No se encontró el correo del paciente en la sesión actual. Cierre sesión e ingrese nuevamente.';
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.feedbackService.getHilosPaciente(email).pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (hilos: Retroalimentacion[]) => {
        this.hilos = hilos;
      },
      error: (err: unknown) => {
        this.hilos = [];
        this.mensajeError = this.obtenerMensajeErrorCarga(err);
      }
    });
  }

  responderHilo(hilo: Retroalimentacion): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    const idHilo = this.obtenerIdHilo(hilo);
    const respuesta = this.respuestasPorHilo[idHilo]?.trim();

    if (!idHilo) {
      this.mensajeError = 'No se pudo identificar el hilo de retroalimentación.';
      return;
    }

    if (!respuesta) {
      this.mensajeError = 'Debe escribir una respuesta antes de enviarla.';
      return;
    }

    this.respondiendoId = idHilo;

    this.feedbackService.responderHilo(idHilo, respuesta).pipe(
      finalize(() => {
        this.respondiendoId = '';
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.respuestasPorHilo[idHilo] = '';
        this.mensajeExito = 'Respuesta enviada correctamente.';
        this.cargarHilos();
      },
      error: (err: unknown) => {
        this.mensajeError = this.obtenerMensajeErrorRespuesta(err);
      }
    });
  }

  obtenerIdHilo = (hilo: Retroalimentacion): string => {
    return hilo?.id ?? '';
  };

  trackByHiloId = (_: number, hilo: Retroalimentacion): string => {
    return hilo?.id ?? '';
  };

  private obtenerMensajeErrorCarga(err: unknown): string {
    if (err instanceof TimeoutError) {
      return 'La carga tardó demasiado. Verifique que MongoAPI esté encendida y que /api/feedback/ping responda.';
    }

    const error = err as any;

    if (error?.status === 500) {
      return `MongoAPI sí recibió la petición, pero se cayó internamente al leer MongoDB. Abra ${environment.mongoApiUrl}/feedback/ping y confirme que diga cliente-feedback-final-v6. Si no dice eso, Azure sigue con el backend viejo.`;
    }

    if (error?.status === 404) {
      return `La ruta de feedback no existe en la MongoAPI que está recibiendo la petición. Abra ${environment.mongoApiUrl}/feedback/ping para confirmar la versión publicada.`;
    }

    if (error?.status === 0) {
      return `El navegador bloqueó o no pudo completar la petición. Casi siempre ocurre porque MongoAPI devolvió 500 sin CORS o porque Azure tiene una versión vieja. Pruebe directamente: ${environment.mongoApiUrl}/feedback/ping`;
    }

    return error?.error?.mensaje ?? 'No se pudo cargar la retroalimentación desde MongoDB.';
  }

  private obtenerMensajeErrorRespuesta(err: unknown): string {
    if (err instanceof TimeoutError) {
      return 'El envío tardó demasiado. Verifique que MongoAPI esté respondiendo.';
    }

    const error = err as any;

    if (error?.status === 405) {
      return 'MongoAPI todavía no tiene habilitado POST /api/feedback/{id}/respuesta. Debe ejecutar o publicar el FeedbackController actualizado.';
    }

    if (error?.status === 404) {
      return 'No se encontró el endpoint para responder este hilo. Revise que exista POST /api/feedback/{id}/respuesta.';
    }

    if (error?.status === 0) {
      return `No se pudo conectar con MongoAPI para enviar la respuesta. Pruebe ${environment.mongoApiUrl}/feedback/ping`;
    }

    return error?.error?.mensaje ?? 'No se pudo enviar la respuesta.';
  }
}
