import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { MedidasService, RegistroMedidas } from '../../services/medidas.service';

@Component({
  selector: 'app-registro-medidas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-medidas.component.html',
  styleUrls: ['./registro-medidas.component.css']
})
export class RegistroMedidasComponent implements OnInit {
  historial: RegistroMedidas[] = [];
  cargando = false;

  mostrarFormulario = false;
  editandoId: number | null = null;
  guardando = false;
  mensajeExito = '';
  mensajeError = '';


  formulario!: RegistroMedidas;
  // formulario: RegistroMedidas = this.medidaVacia();

  get email(): string {
    return this.auth.currentUser?.email ?? '';
  }

  constructor(
    private auth: AuthService,
    private medidasService: MedidasService
  ) { }

ngOnInit(): void {
  this.formulario = this.medidaVacia();
  this.cargarHistorial();
}

  cargarHistorial(): void {
    this.cargando = true;
    this.medidasService.getMedidasPorPaciente(this.email).subscribe({
      next: (medidas) => {
        this.historial = medidas.sort((a, b) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  abrirFormulario(medida?: RegistroMedidas): void {
    this.mostrarFormulario = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    if (medida) {
      this.editandoId = medida.idRegistro ?? null;
      this.formulario = { ...medida };
    } else {
      this.editandoId = null;
      this.formulario = this.medidaVacia();
    }
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
    this.formulario = this.medidaVacia();
  }

  guardar(): void {
    const f = this.formulario;
    if (!f.fecha) {
      this.mensajeError = 'Seleccione una fecha.';
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    f.pacienteEmail = this.email;

    const operacion = this.editandoId
      ? this.medidasService.actualizarMedidas(this.editandoId, f)
      : this.medidasService.registrarMedidas(f);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = this.editandoId
          ? 'Medidas actualizadas.'
          : 'Medidas registradas con éxito.';
        this.cancelar();
        this.cargarHistorial();
        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.mensaje ?? 'Error al guardar.';
      }
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.medidasService.eliminarMedidas(id).subscribe({
      next: () => this.cargarHistorial(),
      error: () => { }
    });
  }

  private medidaVacia(): RegistroMedidas {
    return {
      pacienteEmail: this.email,
      fecha: new Date().toISOString().split('T')[0],
      cintura: 0,
      cuello: 0,
      caderas: 0,
      porcentajeMusculo: 0,
      porcentajeGrasa: 0
    };
  }
}
