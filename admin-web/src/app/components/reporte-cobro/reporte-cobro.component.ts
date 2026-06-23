import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subscription } from 'rxjs';
import { ReporteCobro, ReporteCobroService } from '../../services/reporte-cobro.service';

interface GrupoReporteCobro {
  tipoCobro: string;
  registros: ReporteCobro[];
  montoTotal: number;
  descuento: number;
  montoACobrar: number;
}

@Component({
  selector: 'app-reporte-cobro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte-cobro.component.html',
  styleUrls: ['./reporte-cobro.component.css']
})
export class ReporteCobroComponent implements OnInit, OnDestroy {
  reporte: ReporteCobro[] = [];
  grupos: GrupoReporteCobro[] = [];
  cargando = false;
  mensajeError = '';
  mensajeEstado = '';

  private reporteSub?: Subscription;
  private intentoActual = 0;

  constructor(private reporteCobroService: ReporteCobroService) {}

  ngOnInit(): void {
    this.cargarReporte();
  }

  ngOnDestroy(): void {
    this.reporteSub?.unsubscribe();
  }

  cargarReporte(): void {
    const intento = ++this.intentoActual;

    // Si había una consulta anterior pegada, la cancelamos desde Angular y empezamos otra.
    this.reporteSub?.unsubscribe();

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeEstado = 'Consultando reporte de cobro...';

    this.reporteSub = this.reporteCobroService.obtenerReporte()
      .pipe(
        finalize(() => {
          // Evita que una consulta vieja apague el spinner de una consulta nueva.
          if (intento === this.intentoActual) {
            this.cargando = false;
            this.mensajeEstado = '';
          }
        })
      )
      .subscribe({
        next: (data) => {
          if (intento !== this.intentoActual) return;

          this.reporte = data ?? [];
          this.grupos = this.agruparPorTipoCobro(this.reporte);

          if (this.reporte.length === 0) {
            this.mensajeError = 'El reporte respondió correctamente, pero no hay nutricionistas con pacientes asociados para cobrar.';
          }
        },
        error: (err) => {
          if (intento !== this.intentoActual) return;

          this.reporte = [];
          this.grupos = [];
          this.mensajeError = this.obtenerMensajeError(err);
          console.error('Error cargando reporte de cobro:', err);
        }
      });
  }

  cancelarCarga(): void {
    this.intentoActual++;
    this.reporteSub?.unsubscribe();
    this.cargando = false;
    this.mensajeEstado = '';
    this.mensajeError = 'Se canceló la consulta del reporte.';
  }

  get totalNutricionistas(): number {
    return this.reporte.length;
  }

  get totalPacientes(): number {
    return this.reporte.reduce((total, item) => total + item.totalPacientes, 0);
  }

  get totalGeneral(): number {
    return this.reporte.reduce((total, item) => total + item.montoTotal, 0);
  }

  get descuentoGeneral(): number {
    return this.reporte.reduce((total, item) => total + item.descuento, 0);
  }

  get montoCobrarGeneral(): number {
    return this.reporte.reduce((total, item) => total + item.montoACobrar, 0);
  }

  exportarPdf(): void {
    if (this.reporte.length === 0) {
      this.mensajeError = 'No hay datos para exportar.';
      return;
    }

    const popup = window.open('', '_blank', 'width=1100,height=800');
    if (!popup) {
      this.mensajeError = 'El navegador bloqueó la ventana de exportación. Permita ventanas emergentes para descargar el PDF.';
      return;
    }

    const contenido = this.construirHtmlPdf();
    popup.document.open();
    popup.document.write(contenido);
    popup.document.close();

    setTimeout(() => {
      popup.focus();
      popup.print();
    }, 300);
  }

  private obtenerMensajeError(err: any): string {
    if (err?.name === 'TimeoutError') {
      return 'La consulta tardó demasiado y fue cancelada. Probá directo en el navegador: http://localhost:5274/api/reporte-cobro-ping. Si ese sirve, probá http://localhost:5274/api/reporte-cobro-db-test. Si db-test se pega, el problema está en la conexión a SQL/Azure, no en Angular.';
    }

    if (err?.status === 0) {
      return 'No se pudo conectar con la API SQL_API. Verificá que esté corriendo en http://localhost:5274.';
    }

    if (err?.error?.mensaje && err?.error?.detalle) {
      return `${err.error.mensaje} Detalle: ${err.error.detalle}`;
    }

    if (err?.error?.mensaje) {
      return err.error.mensaje;
    }

    if (err?.message) {
      return err.message;
    }

    return 'No se pudo cargar el reporte de cobro.';
  }

  private agruparPorTipoCobro(data: ReporteCobro[]): GrupoReporteCobro[] {
    const orden = ['Semanal', 'Mensual', 'Anual'];

    return orden
      .map((tipoCobro) => {
        const registros = data.filter((item) => item.tipoCobro === tipoCobro);
        return {
          tipoCobro,
          registros,
          montoTotal: registros.reduce((total, item) => total + item.montoTotal, 0),
          descuento: registros.reduce((total, item) => total + item.descuento, 0),
          montoACobrar: registros.reduce((total, item) => total + item.montoACobrar, 0)
        };
      })
      .filter((grupo) => grupo.registros.length > 0);
  }

  private construirHtmlPdf(): string {
    const fecha = new Date().toLocaleDateString('es-CR');
    const gruposHtml = this.grupos.map((grupo) => this.construirGrupoHtml(grupo)).join('');

    return `
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Reporte de Cobro NutriTEC</title>
        <style>
          body { font-family: Arial, sans-serif; color: #222; margin: 24px; }
          h1 { color: #1b5e20; margin-bottom: 4px; }
          h2 { color: #2e7d32; margin-top: 28px; border-bottom: 2px solid #2e7d32; padding-bottom: 4px; }
          .subtitulo { color: #666; margin-bottom: 18px; }
          .resumen { display: flex; gap: 12px; flex-wrap: wrap; margin: 18px 0; }
          .resumen div { border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; min-width: 150px; }
          .resumen strong { display: block; color: #1b5e20; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #2e7d32; color: #fff; text-align: left; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          .text-end { text-align: right; }
          .total-row td { font-weight: bold; background: #f0f7f1; }
          @media print { body { margin: 12mm; } }
        </style>
      </head>
      <body>
        <h1>Reporte de Cobro NutriTEC</h1>
        <div class="subtitulo">Generado el ${fecha}</div>
        <div class="resumen">
          <div><span>Nutricionistas</span><strong>${this.totalNutricionistas}</strong></div>
          <div><span>Pacientes asociados</span><strong>${this.totalPacientes}</strong></div>
          <div><span>Monto total</span><strong>${this.formatoMoneda(this.totalGeneral)}</strong></div>
          <div><span>Descuento</span><strong>${this.formatoMoneda(this.descuentoGeneral)}</strong></div>
          <div><span>Monto a cobrar</span><strong>${this.formatoMoneda(this.montoCobrarGeneral)}</strong></div>
        </div>
        ${gruposHtml}
      </body>
      </html>
    `;
  }

  private construirGrupoHtml(grupo: GrupoReporteCobro): string {
    const filas = grupo.registros.map((item) => `
      <tr>
        <td>${this.escaparHtml(item.email)}</td>
        <td>${this.escaparHtml(item.nombreCompleto)}</td>
        <td>${this.escaparHtml(item.numeroTarjeta)}</td>
        <td class="text-end">${item.totalPacientes}</td>
        <td class="text-end">${this.formatoMoneda(item.montoTotal)}</td>
        <td class="text-end">${this.formatoMoneda(item.descuento)}</td>
        <td class="text-end">${this.formatoMoneda(item.montoACobrar)}</td>
      </tr>
    `).join('');

    return `
      <h2>Tipo de pago: ${this.escaparHtml(grupo.tipoCobro)}</h2>
      <table>
        <thead>
          <tr>
            <th>Correo electrónico</th>
            <th>Nombre completo</th>
            <th>Número de tarjeta</th>
            <th class="text-end">Pacientes</th>
            <th class="text-end">Monto total</th>
            <th class="text-end">Descuento</th>
            <th class="text-end">Monto a cobrar</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
          <tr class="total-row">
            <td colspan="4">Subtotal ${this.escaparHtml(grupo.tipoCobro)}</td>
            <td class="text-end">${this.formatoMoneda(grupo.montoTotal)}</td>
            <td class="text-end">${this.formatoMoneda(grupo.descuento)}</td>
            <td class="text-end">${this.formatoMoneda(grupo.montoACobrar)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private formatoMoneda(valor: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor ?? 0);
  }

  private escaparHtml(valor: string): string {
    return (valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
