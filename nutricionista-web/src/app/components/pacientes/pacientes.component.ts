import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import {
  NutricionistaService,
  PacienteAsociado,
  PacienteBusqueda
} from '../../services/nutricionista.service';

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

  buscando = false;
  cargandoAsociados = false;
  asociandoEmail = '';

  mensajeExito = '';
  mensajeError = '';
  busquedaRealizada = false;

  constructor(
    private nutricionistaService: NutricionistaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarPacientesAsociados();
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

  estaAsociadoConOtroNutricionista(paciente: PacienteBusqueda): boolean {
    return !!paciente.nutricionistaActualCodigo &&
      paciente.nutricionistaActualCodigo.toLowerCase() !== this.codigoNutricionista.toLowerCase();
  }
}
