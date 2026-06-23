import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { NutricionistaService, PacienteAsociado } from '../../services/nutricionista.service';
import {
  ConsumoResumen,
  PlanAsignado,
  Retroalimentacion,
  SeguimientoService
} from '../../services/seguimiento.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedBackComponent implements OnInit {
  pacientesAsociados: PacienteAsociado[] = [];
  pacienteSeleccionadoEmail = '';
  fechaSeleccionada = this.fechaHoy();

  planesAsignados: PlanAsignado[] = [];
  resumenConsumo: ConsumoResumen[] = [];
  hilos: Retroalimentacion[] = [];

  tituloHilo = '';
  mensajeNuevo = '';
  respuestasPorHilo: { [id: string]: string } = {};

  cargandoPacientes = false;
  cargandoPlanes = false;
  cargandoConsumo = false;
  cargandoHilos = false;
  guardando = false;
  respondiendoId = '';

  mensajeExito = '';
  errorPacientes = '';
  errorPlanes = '';
  errorConsumo = '';
  errorMongo = '';
  errorFormulario = '';

  mongoPingOk = false;
  mongoPingMensaje = '';

  private readonly tiempoMaximoCargaMs = 12000;

  constructor(
    private authService: AuthService,
    private nutricionistaService: NutricionistaService,
    private seguimientoService: SeguimientoService
  ) {}

  ngOnInit(): void {
    this.probarMongo();
    this.cargarPacientesAsociados();
  }

  get codigoNutricionista(): string {
    return this.authService.currentUser?.codigoNutricionista ?? '';
  }

  get pacienteSeleccionado(): PacienteAsociado | undefined {
    return this.pacientesAsociados.find(
      (p: PacienteAsociado) =>
        p.pacienteEmail.toLowerCase() === this.pacienteSeleccionadoEmail.toLowerCase()
    );
  }

  get totalCaloriasDia(): number {
    return this.resumenConsumo.reduce(
      (total: number, grupo: ConsumoResumen) => total + Number(grupo.totalCalorias || 0),
      0
    );
  }

  get totalCaloriasPlan(): number {
    return this.planesAsignados.reduce(
      (total: number, plan: PlanAsignado) => total + Number(plan.caloriasTotales || 0),
      0
    );
  }

  get hayCargaActiva(): boolean {
    return this.cargandoPacientes || this.cargandoPlanes || this.cargandoConsumo || this.cargandoHilos;
  }

  probarMongo(): void {
    this.mongoPingOk = false;
    this.mongoPingMensaje = 'Verificando MongoAPI...';

    this.seguimientoService.pingMongo()
      .pipe(timeout(5000))
      .subscribe({
        next: () => {
          this.mongoPingOk = true;
          this.mongoPingMensaje = 'MongoAPI actualizada';
        },
        error: (_err: unknown) => {
          this.mongoPingOk = false;
          this.mongoPingMensaje = 'MongoAPI sin ping; puede seguir probando el foro';
        }
      });
  }

  cargarPacientesAsociados(): void {
    this.detenerCargas();
    this.mensajeExito = '';
    this.errorPacientes = '';
    this.errorFormulario = '';

    if (!this.codigoNutricionista) {
      this.errorPacientes = 'No se encontró el código del nutricionista en la sesión actual. Cierre sesión e ingrese nuevamente.';
      return;
    }

    this.cargandoPacientes = true;

    this.nutricionistaService.getPacientesAsociados(this.codigoNutricionista)
      .pipe(
        timeout(this.tiempoMaximoCargaMs),
        finalize(() => {
          this.cargandoPacientes = false;
        })
      )
      .subscribe({
        next: (pacientes: PacienteAsociado[]) => {
          this.pacientesAsociados = pacientes ?? [];

          if (!this.pacienteSeleccionadoEmail && this.pacientesAsociados.length > 0) {
            this.pacienteSeleccionadoEmail = this.pacientesAsociados[0].pacienteEmail;
          }

          this.prepararTitulo();

          if (this.pacienteSeleccionadoEmail) {
            this.cargarSeguimiento();
          }
        },
        error: (err: unknown) => {
          this.errorPacientes = this.obtenerMensajeError(err, 'No se pudieron cargar los pacientes asociados.');
        }
      });
  }

  refrescarTodo(): void {
    this.detenerCargas();
    this.probarMongo();

    if (!this.pacienteSeleccionadoEmail) {
      this.cargarPacientesAsociados();
      return;
    }

    this.cargarSeguimiento();
  }

  seleccionarPaciente(email: string): void {
    this.pacienteSeleccionadoEmail = email;
    this.limpiarErroresDeSeguimiento();
    this.prepararTitulo();
    this.cargarSeguimiento();
  }

  seleccionarFecha(fecha: string): void {
    this.fechaSeleccionada = fecha || this.fechaHoy();
    this.limpiarErroresDeSeguimiento();
    this.prepararTitulo();
    this.cargarSeguimiento();
  }

  cargarSeguimiento(): void {
    this.errorFormulario = '';

    if (!this.pacienteSeleccionadoEmail) {
      this.planesAsignados = [];
      this.resumenConsumo = [];
      this.hilos = [];
      this.detenerCargas();
      return;
    }

    this.cargarPlanesAsignados();
    this.cargarConsumoPaciente();
    this.cargarHilosPaciente();
  }

  cargarPlanesAsignados(): void {
    if (!this.pacienteSeleccionadoEmail || !this.codigoNutricionista) return;

    this.cargandoPlanes = true;
    this.errorPlanes = '';

    this.seguimientoService.getPlanesAsignados(
      this.pacienteSeleccionadoEmail,
      this.codigoNutricionista,
      this.fechaSeleccionada
    )
      .pipe(
        timeout(this.tiempoMaximoCargaMs),
        finalize(() => {
          this.cargandoPlanes = false;
        })
      )
      .subscribe({
        next: (planes: PlanAsignado[]) => {
          this.planesAsignados = planes ?? [];
        },
        error: (err: unknown) => {
          this.planesAsignados = [];
          this.errorPlanes = this.obtenerMensajeError(err, 'No se pudieron cargar los planes asignados para esta fecha.');
        }
      });
  }

  cargarConsumoPaciente(): void {
    if (!this.pacienteSeleccionadoEmail) return;

    this.cargandoConsumo = true;
    this.errorConsumo = '';

    this.seguimientoService.getResumenConsumo(this.pacienteSeleccionadoEmail, this.fechaSeleccionada)
      .pipe(
        timeout(this.tiempoMaximoCargaMs),
        finalize(() => {
          this.cargandoConsumo = false;
        })
      )
      .subscribe({
        next: (resumen: ConsumoResumen[]) => {
          this.resumenConsumo = resumen ?? [];
        },
        error: (err: unknown) => {
          this.resumenConsumo = [];
          this.errorConsumo = this.obtenerMensajeError(err, 'No se pudo cargar el consumo registrado por el paciente.');
        }
      });
  }

  cargarHilosPaciente(): void {
    if (!this.pacienteSeleccionadoEmail || !this.codigoNutricionista) return;

    this.cargandoHilos = true;
    this.errorMongo = '';

    this.seguimientoService
      .getHilosPacienteNutricionista(this.pacienteSeleccionadoEmail, this.codigoNutricionista)
      .pipe(
        timeout(this.tiempoMaximoCargaMs),
        finalize(() => {
          this.cargandoHilos = false;
        })
      )
      .subscribe({
        next: (hilos: Retroalimentacion[]) => {
          this.hilos = hilos ?? [];
        },
        error: (err: unknown) => {
          this.hilos = [];
          this.errorMongo = this.obtenerMensajeError(err, 'No se pudieron cargar las retroalimentaciones desde MongoDB.');
        }
      });
  }

  guardarRetroalimentacion(): void {
    this.mensajeExito = '';
    this.errorFormulario = '';
    this.errorMongo = '';

    if (!this.pacienteSeleccionadoEmail || !this.codigoNutricionista) {
      this.errorFormulario = 'Debe seleccionar un paciente válido.';
      return;
    }

    if (!this.mensajeNuevo.trim()) {
      this.errorFormulario = 'Debe escribir una retroalimentación antes de guardar.';
      return;
    }

    this.guardando = true;

    this.seguimientoService.crearRetroalimentacion({
      pacienteId: this.pacienteSeleccionadoEmail,
      nutricionistaId: this.codigoNutricionista,
      tituloHilo: this.tituloHilo.trim() || this.tituloPorDefecto(),
      mensajeInicial: this.mensajeNuevo.trim(),
      fechaConsumo: this.fechaSeleccionada
    })
      .pipe(
        timeout(this.tiempoMaximoCargaMs),
        finalize(() => {
          this.guardando = false;
        })
      )
      .subscribe({
        next: (_hilo: Retroalimentacion) => {
          this.mensajeNuevo = '';
          this.prepararTitulo();
          this.mensajeExito = 'Retroalimentación guardada correctamente en MongoDB.';
          this.cargarHilosPaciente();
        },
        error: (err: unknown) => {
          this.errorMongo = this.obtenerMensajeError(err, 'No se pudo guardar la retroalimentación en MongoDB.');
        }
      });
  }

  responderHilo(hilo: Retroalimentacion): void {
    this.mensajeExito = '';
    this.errorFormulario = '';
    this.errorMongo = '';

    const respuesta = this.respuestasPorHilo[hilo.id]?.trim();

    if (!respuesta) {
      this.errorFormulario = 'Debe escribir una respuesta antes de enviarla.';
      return;
    }

    this.respondiendoId = hilo.id;

    this.seguimientoService.agregarRespuesta(hilo.id, {
      autor: 'Nutricionista',
      mensaje: respuesta
    })
      .pipe(
        timeout(this.tiempoMaximoCargaMs),
        finalize(() => {
          this.respondiendoId = '';
        })
      )
      .subscribe({
        next: (_hilo: Retroalimentacion) => {
          this.respuestasPorHilo[hilo.id] = '';
          this.mensajeExito = 'Respuesta agregada al hilo de seguimiento.';
          this.cargarHilosPaciente();
        },
        error: (err: unknown) => {
          this.errorMongo = this.obtenerMensajeError(err, 'No se pudo agregar la respuesta en MongoDB.');
        }
      });
  }

  prepararTitulo(): void {
    this.tituloHilo = this.tituloPorDefecto();
  }

  tituloPorDefecto(): string {
    const paciente = this.pacienteSeleccionado?.nombreCompleto ?? this.pacienteSeleccionadoEmail;
    return `Seguimiento del plan alimenticio - ${paciente} - ${this.fechaSeleccionada}`;
  }

  trackByHiloId(_: number, hilo: Retroalimentacion): string {
    return hilo.id;
  }

  trackByPlanId(_: number, plan: PlanAsignado): number {
    return plan.idAsignacion;
  }

  private detenerCargas(): void {
    this.cargandoPacientes = false;
    this.cargandoPlanes = false;
    this.cargandoConsumo = false;
    this.cargandoHilos = false;
  }

  private limpiarErroresDeSeguimiento(): void {
    this.errorPlanes = '';
    this.errorConsumo = '';
    this.errorMongo = '';
    this.errorFormulario = '';
    this.mensajeExito = '';
  }

  private obtenerMensajeError(err: unknown, mensajeDefecto: string): string {
    if (this.esTimeout(err)) {
      return `${mensajeDefecto} La petición tardó demasiado. Verifique en Network si la API quedó en Pending o use el botón Refrescar seguimiento.`;
    }

    if (err instanceof HttpErrorResponse) {
      const errorBody = err.error;

      if (errorBody?.mensaje) {
        const detalle = errorBody?.detalle ? ` Detalle: ${errorBody.detalle}` : '';
        return `${errorBody.mensaje}${detalle}`;
      }

      if (err.status === 0) {
        return `${mensajeDefecto} Revise que la API esté encendida y que la URL en environment.ts sea correcta.`;
      }

      if (err.status === 405) {
        return `${mensajeDefecto} La MongoAPI que está recibiendo la petición todavía no tiene POST habilitado en /api/feedback. Publique o ejecute la versión actualizada del controller.`;
      }

      if (err.status === 404) {
        return `${mensajeDefecto} La ruta no existe en la API actual. Verifique que esté usando el backend actualizado.`;
      }

      return `${mensajeDefecto} Código HTTP: ${err.status}.`;
    }

    return mensajeDefecto;
  }

  private esTimeout(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'name' in err && (err as { name?: string }).name === 'TimeoutError';
  }

  private fechaHoy(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
