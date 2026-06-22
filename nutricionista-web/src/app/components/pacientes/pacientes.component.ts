import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import {
  NutricionistaService,
  PacienteAsociado,
  PacienteBusqueda
} from '../../services/nutricionista.service';

import { PlanAlimentacion, PlanService } from '../../services/plan.service';
import { PlanPaciente, PlanPacienteService } from '../../services/plan-paciente.service';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {
  terminoBusqueda = '';
  resultados: PacienteBusqueda[] = [];
  pacientesAsociados: PacienteAsociado[] = [];

  planes: PlanAlimentacion[] = [];
  asignaciones: PlanPaciente[] = [];

  planSeleccionadoPorPaciente: { [email: string]: number } = {};
  fechaInicioPorPaciente: { [email: string]: string } = {};
  fechaFinPorPaciente: { [email: string]: string } = {};

  buscando = false;
  cargandoAsociados = false;
  asociandoEmail = '';
  asignandoEmail = '';

  mensajeExito = '';
  mensajeError = '';
  busquedaRealizada = false;

  constructor(
    private nutricionistaService: NutricionistaService,
    private authService: AuthService,
    private planService: PlanService,
    private planPacienteService: PlanPacienteService
  ) {}

  ngOnInit(): void {
    this.cargarPacientesAsociados();
    this.cargarPlanes();
    this.cargarAsignaciones();
  }

  get codigoNutricionista(): string {
    return this.authService.currentUser?.codigoNutricionista ?? '';
  }

  cargarPacientesAsociados(): void {
    this.mensajeError = '';

    if (!this.codigoNutricionista) {
      this.mensajeError = 'No se encontró el código del nutricionista en la sesión actual.';
      return;
    }

    this.cargandoAsociados = true;

    this.nutricionistaService.getPacientesAsociados(this.codigoNutricionista).subscribe({
      next: (pacientes) => {
        this.pacientesAsociados = pacientes;
        this.cargandoAsociados = false;
      },
      error: (err) => {
        this.cargandoAsociados = false;
        this.mensajeError = err?.error?.mensaje ?? 'No se pudieron cargar los pacientes asociados.';
      }
    });
  }

  cargarPlanes(): void {
    if (!this.codigoNutricionista) return;

    this.planService.getPlanesPorNutricionista(this.codigoNutricionista).subscribe({
      next: (planes) => {
        this.planes = planes;
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar los planes del nutricionista.';
      }
    });
  }

  cargarAsignaciones(): void {
    if (!this.codigoNutricionista) return;

    this.planPacienteService.getAsignaciones(this.codigoNutricionista).subscribe({
      next: (asignaciones) => {
        this.asignaciones = asignaciones;
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar las asignaciones de planes.';
      }
    });
  }

  buscarPacientes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.busquedaRealizada = true;

    if (!this.codigoNutricionista) {
      this.mensajeError = 'No se encontró el código del nutricionista en la sesión actual.';
      return;
    }

    this.buscando = true;

    this.nutricionistaService.buscarPacientes(this.codigoNutricionista, this.terminoBusqueda).subscribe({
      next: (pacientes) => {
        this.resultados = pacientes;
        this.buscando = false;
      },
      error: (err) => {
        this.buscando = false;
        this.mensajeError = err?.error?.mensaje ?? 'No se pudo realizar la búsqueda de pacientes.';
      }
    });
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.resultados = [];
    this.busquedaRealizada = false;
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  asociarPaciente(paciente: PacienteBusqueda): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (!this.codigoNutricionista) {
      this.mensajeError = 'No se encontró el código del nutricionista en la sesión actual.';
      return;
    }

    this.asociandoEmail = paciente.email;

    this.nutricionistaService.asociarPaciente(this.codigoNutricionista, paciente.email).subscribe({
      next: (respuesta) => {
        this.asociandoEmail = '';
        this.mensajeExito = respuesta?.mensaje ?? 'Paciente asociado correctamente.';

        this.resultados = this.resultados.map((item) =>
          item.email.toLowerCase() === paciente.email.toLowerCase()
            ? {
                ...item,
                asociadoAlNutricionista: true,
                nutricionistaActualCodigo: this.codigoNutricionista,
                fechaAsociacion: respuesta.fechaAsociacion
              }
            : item
        );

        this.cargarPacientesAsociados();
      },
      error: (err) => {
        this.asociandoEmail = '';
        this.mensajeError = err?.error?.mensaje ?? 'No se pudo asociar el paciente.';
      }
    });
  }

  asignarPlan(paciente: PacienteAsociado): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    const email = paciente.pacienteEmail;
    const idPlan = this.planSeleccionadoPorPaciente[email];
    const fechaInicio = this.fechaInicioPorPaciente[email];
    const fechaFin = this.fechaFinPorPaciente[email];

    if (!idPlan) {
      this.mensajeError = 'Debe seleccionar un plan.';
      return;
    }

    if (!fechaInicio || !fechaFin) {
      this.mensajeError = 'Debe seleccionar fecha de inicio y fecha fin.';
      return;
    }

    if (fechaFin < fechaInicio) {
      this.mensajeError = 'La fecha fin no puede ser menor que la fecha inicio.';
      return;
    }

    const asignacion: PlanPaciente = {
      pacienteEmail: email,
      idPlan,
      nutricionistaCodigo: this.codigoNutricionista,
      fechaInicio,
      fechaFin
    };

    this.asignandoEmail = email;

    this.planPacienteService.asignarPlan(asignacion).subscribe({
      next: (respuesta) => {
        this.asignandoEmail = '';
        this.mensajeExito = respuesta?.mensaje ?? 'Plan asignado correctamente.';

        this.planSeleccionadoPorPaciente[email] = 0;
        this.fechaInicioPorPaciente[email] = '';
        this.fechaFinPorPaciente[email] = '';

        this.cargarAsignaciones();
      },
      error: (err) => {
        this.asignandoEmail = '';
        this.mensajeError = err?.error?.mensaje ?? 'No se pudo asignar el plan.';
      }
    });
  }

  obtenerAsignacionPaciente(email: string): PlanPaciente | undefined {
    return this.asignaciones.find(a =>
      a.pacienteEmail.toLowerCase() === email.toLowerCase()
    );
  }

  obtenerNombrePlanAsignado(email: string): string {
    const asignacion = this.obtenerAsignacionPaciente(email);

    if (!asignacion) return 'Sin plan asignado';

    return asignacion.planAlimentacion?.nombrePlan ?? `Plan #${asignacion.idPlan}`;
  }

  estaAsociadoConOtroNutricionista(paciente: PacienteBusqueda): boolean {
    return !!paciente.nutricionistaActualCodigo &&
      paciente.nutricionistaActualCodigo.toLowerCase() !== this.codigoNutricionista.toLowerCase();
  }
}