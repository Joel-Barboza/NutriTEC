import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { Producto, ProductoService } from '../../services/producto.service';
import { PlanAlimentacion, PlanDetalle, PlanService } from '../../services/plan.service';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.css']
})
export class PlanesComponent implements OnInit {
  planes: PlanAlimentacion[] = [];
  productos: Producto[] = [];

  tiemposComida = [
    'Desayuno',
    'Merienda Mañana',
    'Almuerzo',
    'Merienda Tarde',
    'Cena'
  ];

  nuevoPlan: PlanAlimentacion = this.planVacio();

  mensajeExito = '';
  mensajeError = '';
  guardando = false;

  editando = false;
  idPlanEditando: number | null = null;

  planExpandidoId: number | null = null;

  constructor(
    private planService: PlanService,
    private productoService: ProductoService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarPlanes();
  }

  cargarProductos(): void {
    this.productoService.getAprobados().subscribe({
      next: (productos) => {
        this.productos = productos;
      },
      error: () => {
        this.mensajeError = 'Error al cargar productos aprobados.';
      }
    });
  }

  cargarPlanes(): void {
    const codigo = this.auth.currentUser?.codigoNutricionista ?? '';

    if (!codigo) {
      this.mensajeError = 'No se encontró el código del nutricionista.';
      return;
    }

    this.planService.getPlanesPorNutricionista(codigo).subscribe({
      next: (planes) => {
        this.planes = planes;
      },
      error: () => {
        this.mensajeError = 'Error al cargar planes.';
      }
    });
  }

  agregarProducto(tiempo: string): void {
    this.nuevoPlan.detalles.push({
      tiempoComida: tiempo,
      productoCodigo: '',
      porciones: 1
    });
  }

  eliminarDetalle(index: number): void {
    this.nuevoPlan.detalles.splice(index, 1);
  }

  detallesPorTiempoFormulario(tiempo: string): PlanDetalle[] {
    return this.nuevoPlan.detalles.filter(d => d.tiempoComida === tiempo);
  }

  detallesPorTiempoPlan(plan: PlanAlimentacion, tiempo: string): PlanDetalle[] {
    return plan.detalles?.filter(d => d.tiempoComida === tiempo) ?? [];
  }

  calcularTotalTemporal(): number {
    return this.nuevoPlan.detalles.reduce((total, detalle) => {
      return total + this.calcularCaloriasDetalle(detalle);
    }, 0);
  }

  calcularCaloriasDetalle(detalle: PlanDetalle): number {
    const producto = this.productos.find(p => p.codigoBarras === detalle.productoCodigo)
      ?? detalle.producto;

    const calorias = producto?.energiaKcal ?? 0;
    const porciones = detalle.porciones ?? 0;

    return calorias * porciones;
  }

  obtenerNombreProducto(detalle: PlanDetalle): string {
    const producto = this.productos.find(p => p.codigoBarras === detalle.productoCodigo)
      ?? detalle.producto;

    return producto?.descripcion ?? detalle.productoCodigo;
  }

  guardarPlan(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (!this.nuevoPlan.nombrePlan.trim()) {
      this.mensajeError = 'Debe ingresar el nombre del plan.';
      return;
    }

    if (this.nuevoPlan.detalles.length === 0) {
      this.mensajeError = 'Debe agregar al menos un producto al plan.';
      return;
    }

    if (this.nuevoPlan.detalles.some(d => !d.productoCodigo)) {
      this.mensajeError = 'Todos los productos agregados deben estar seleccionados.';
      return;
    }

    if (this.nuevoPlan.detalles.some(d => !d.porciones || d.porciones <= 0)) {
      this.mensajeError = 'Las porciones deben ser mayores a cero.';
      return;
    }

    const codigo = this.auth.currentUser?.codigoNutricionista ?? '';

    if (!codigo) {
      this.mensajeError = 'No se encontró el nutricionista autenticado.';
      return;
    }

    this.nuevoPlan.nutricionistaCodigo = codigo;
    this.guardando = true;

    if (this.editando && this.idPlanEditando) {
      this.planService.actualizarPlan(this.idPlanEditando, this.nuevoPlan).subscribe({
        next: () => {
          this.guardando = false;
          this.mensajeExito = 'Plan actualizado correctamente.';
          this.limpiarFormulario();
          this.cargarPlanes();
        },
        error: (err) => {
          this.guardando = false;
          this.mensajeError = err?.error?.mensaje ?? 'Error al actualizar el plan.';
        }
      });

      return;
    }

    this.planService.crearPlan(this.nuevoPlan).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Plan creado correctamente.';
        this.limpiarFormulario();
        this.cargarPlanes();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.mensaje ?? 'Error al crear el plan.';
      }
    });
  }

  editarPlan(plan: PlanAlimentacion): void {
    this.editando = true;
    this.idPlanEditando = plan.idPlan ?? null;
    this.mensajeExito = '';
    this.mensajeError = '';

    this.nuevoPlan = {
      idPlan: plan.idPlan,
      nombrePlan: plan.nombrePlan,
      nutricionistaCodigo: plan.nutricionistaCodigo,
      caloriasTotales: plan.caloriasTotales,
      detalles: plan.detalles.map(d => ({
        idPlanDetalle: d.idPlanDetalle,
        idPlan: d.idPlan,
        tiempoComida: d.tiempoComida,
        productoCodigo: d.productoCodigo,
        porciones: d.porciones,
        producto: d.producto
      }))
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  eliminarPlan(idPlan?: number): void {
    if (!idPlan) return;

    if (!confirm('¿Seguro que desea eliminar este plan?')) return;

    this.planService.eliminarPlan(idPlan).subscribe({
      next: () => {
        this.mensajeExito = 'Plan eliminado correctamente.';
        this.cargarPlanes();
      },
      error: () => {
        this.mensajeError = 'Error al eliminar el plan.';
      }
    });
  }

  toggleDetallePlan(idPlan?: number): void {
    if (!idPlan) return;

    this.planExpandidoId = this.planExpandidoId === idPlan ? null : idPlan;
  }

  tieneDetallesEnTiempo(plan: PlanAlimentacion, tiempo: string): boolean {
    return this.detallesPorTiempoPlan(plan, tiempo).length > 0;
  }

  private limpiarFormulario(): void {
    this.nuevoPlan = this.planVacio();
    this.editando = false;
    this.idPlanEditando = null;
    this.guardando = false;
  }

  private planVacio(): PlanAlimentacion {
    return {
      nombrePlan: '',
      nutricionistaCodigo: '',
      detalles: []
    };
  }
}