import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { NutricionistaService, PacienteAsociado } from '../../services/nutricionista.service';
import { PlanAlimentacion, PlanService } from '../../services/plan.service';
import { PlanPaciente, PlanPacienteService } from '../../services/plan-paciente.service';

@Component({
  selector: 'app-asignar-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignar-plan.component.html',
  styleUrls: ['./asignar-plan.component.css']
})
export class AsignarPlanComponent implements OnInit {
  pacientesAsociados: PacienteAsociado[] = [];
  planes: PlanAlimentacion[] = [];
  asignaciones: PlanPaciente[] = [];

  pacienteSeleccionado = '';
  idPlanSeleccionado = 0;
  fechaInicio = '';
  fechaFin = '';

  guardando = false;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private authService: AuthService,
    private nutricionistaService: NutricionistaService,
    private planService: PlanService,
    private planPacienteService: PlanPacienteService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  get codigoNutricionista(): string {
    return this.authService.currentUser?.codigoNutricionista ?? '';
  }

  cargarDatos(): void {
    if (!this.codigoNutricionista) {
      this.mensajeError = 'No se encontró el código del nutricionista.';
      return;
    }

    this.nutricionistaService.getPacientesAsociados(this.codigoNutricionista).subscribe({
      next: (pacientes) => this.pacientesAsociados = pacientes,
      error: () => this.mensajeError = 'No se pudieron cargar los pacientes asociados.'
    });

    this.planService.getPlanesPorNutricionista(this.codigoNutricionista).subscribe({
      next: (planes) => this.planes = planes,
      error: () => this.mensajeError = 'No se pudieron cargar los planes.'
    });

    this.planPacienteService.getAsignaciones(this.codigoNutricionista).subscribe({
      next: (asignaciones) => this.asignaciones = asignaciones,
      error: () => this.mensajeError = 'No se pudieron cargar las asignaciones.'
    });
  }

  asignarPlan(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (!this.pacienteSeleccionado || !this.idPlanSeleccionado || !this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Complete paciente, plan y fechas.';
      return;
    }

    if (this.fechaFin < this.fechaInicio) {
      this.mensajeError = 'La fecha fin no puede ser menor que la fecha inicio.';
      return;
    }

    const asignacion: PlanPaciente = {
      pacienteEmail: this.pacienteSeleccionado,
      idPlan: this.idPlanSeleccionado,
      nutricionistaCodigo: this.codigoNutricionista,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin
    };

    this.guardando = true;

    this.planPacienteService.asignarPlan(asignacion).subscribe({
      next: (respuesta) => {
        this.guardando = false;
        this.mensajeExito = respuesta?.mensaje ?? 'Plan asignado correctamente.';
        this.limpiarFormulario();
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.mensaje ?? 'No se pudo asignar el plan.';
      }
    });
  }

  limpiarFormulario(): void {
    this.pacienteSeleccionado = '';
    this.idPlanSeleccionado = 0;
    this.fechaInicio = '';
    this.fechaFin = '';
  }

  obtenerNombrePaciente(email: string): string {
    return this.pacientesAsociados.find(p => p.pacienteEmail === email)?.nombreCompleto ?? email;
  }

  eliminarAsignacion(id?: number): void {
    if (!id) return;

    if (!confirm('¿Seguro que desea eliminar esta asignación?')) return;

    this.planPacienteService.eliminarAsignacion(id).subscribe({
      next: () => {
        this.mensajeExito = 'Asignación eliminada correctamente.';
        this.cargarDatos();
      },
      error: () => this.mensajeError = 'No se pudo eliminar la asignación.'
    });
  }
}