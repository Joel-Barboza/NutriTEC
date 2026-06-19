import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { MedidasService, RegistroMedidas } from '../../services/medidas.service';

@Component({
  selector: 'app-reporte-avance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-avance.component.html',
  styleUrls: ['./reporte-avance.component.css']
})
export class ReporteAvanceComponent {
  fechaInicio: string = '';
  fechaFin: string = new Date().toISOString().split('T')[0];
  registros: RegistroMedidas[] = [];
  cargando = false;
  buscado = false;
  mensajeError = '';

  get email(): string {
    return this.auth.currentUser?.email ?? '';
  }

  get nombrePaciente(): string {
    const u = this.auth.currentUser;
    return u ? `${u.nombre} ${u.apellido1} ${u.apellido2}` : '';
  }

  constructor(
    private auth: AuthService,
    private medidasService: MedidasService
  ) {
    // Por defecto: último mes
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    this.fechaInicio = hace30.toISOString().split('T')[0];
  }

  buscar(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Seleccione las fechas de inicio y fin.';
      return;
    }
    if (new Date(this.fechaInicio) > new Date(this.fechaFin)) {
      this.mensajeError = 'La fecha de inicio debe ser anterior a la fecha fin.';
      return;
    }

    this.mensajeError = '';
    this.cargando = true;
    this.buscado = false;

    this.medidasService.getMedidasPorRango(this.email, this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => {
        this.registros = data;
        this.cargando = false;
        this.buscado = true;
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'Error al obtener el reporte.';
      }
    });
  }

  exportarPDF(): void {
    window.print();
  }

  // Para mostrar la variación entre fechas
  variacion(campo: keyof RegistroMedidas, index: number): number | null {
    if (index === 0) return null;
    const actual = this.registros[index][campo] as number;
    const anterior = this.registros[index - 1][campo] as number;
    return parseFloat((actual - anterior).toFixed(2));
  }

  claseBadge(valor: number | null, campo: string): string {
    if (valor === null) return '';
    const reducir = ['cintura', 'caderas', 'porcentajeGrasa'];
    const positivo = valor > 0;
    const esBueno = reducir.includes(campo) ? !positivo : positivo;
    if (valor === 0) return 'text-muted';
    return esBueno ? 'text-success' : 'text-danger';
  }
}
