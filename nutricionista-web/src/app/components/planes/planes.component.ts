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
      next: (productos) => this.productos = productos,
      error: () => this.mensajeError = 'Error al cargar productos aprobados.'
    });
  }

  cargarPlanes(): void {
    const codigo = this.auth.currentUser?.codigoNutricionista ?? '';

    if (!codigo) {
      this.mensajeError = 'No se encontró el código del nutricionista.';
      return;
    }

    this.planService.getPlanesPorNutricionista(codigo).subscribe({
      next: (planes) => this.planes = planes,
      error: () => this.mensajeError = 'Error al cargar planes.'
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

  detallesPorTiempo(tiempo: string): PlanDetalle[] {
    return this.nuevoPlan.detalles.filter(d => d.tiempoComida === tiempo);
  }

  calcularTotalTemporal(): number {
    return this.nuevoPlan.detalles.reduce((total, detalle) => {
      const producto = this.productos.find(p => p.codigoBarras === detalle.productoCodigo);
      return total + ((producto?.energiaKcal ?? 0) * detalle.porciones);
    }, 0);
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

    const codigo = this.auth.currentUser?.codigoNutricionista ?? '';

    if (!codigo) {
      this.mensajeError = 'No se encontró el nutricionista autenticado.';
      return;
    }

    this.nuevoPlan.nutricionistaCodigo = codigo;
    this.guardando = true;

    this.planService.crearPlan(this.nuevoPlan).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Plan creado correctamente.';
        this.nuevoPlan = this.planVacio();
        this.cargarPlanes();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.mensaje ?? 'Error al crear el plan.';
      }
    });
  }

  eliminarPlan(idPlan?: number): void {
    if (!idPlan) return;

    if (!confirm('¿Seguro que desea eliminar este plan?')) return;

    this.planService.eliminarPlan(idPlan).subscribe({
      next: () => {
        this.mensajeExito = 'Plan eliminado correctamente.';
        this.cargarPlanes();
      },
      error: () => this.mensajeError = 'Error al eliminar el plan.'
    });
  }

  private planVacio(): PlanAlimentacion {
    return {
      nombrePlan: '',
      nutricionistaCodigo: '',
      detalles: []
    };
  }
}