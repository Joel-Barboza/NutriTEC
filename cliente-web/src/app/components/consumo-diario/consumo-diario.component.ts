import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { Producto, ProductoService } from '../../services/producto.service';
import { Receta, RecetaService } from '../../services/receta.service';
import { ConsumoService, ResumenComida } from '../../services/consumo.service';

const TIEMPOS = ['Desayuno', 'Merienda Mañana', 'Almuerzo', 'Merienda Tarde', 'Cena'];

@Component({
  selector: 'app-consumo-diario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consumo-diario.component.html',
  styleUrls: ['./consumo-diario.component.css']
})
export class ConsumoDiarioComponent implements OnInit {
  readonly tiempos = TIEMPOS;

  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  resumen: ResumenComida[] = [];
  cargandoResumen = false;

  tiempoSeleccionado = 'Desayuno';
  tipoBusqueda: 'producto' | 'receta' = 'producto';
  terminoBusqueda = '';
  productosEncontrados: Producto[] = [];
  recetasDisponibles: Receta[] = [];
  buscando = false;

  itemSeleccionado: Producto | Receta | null = null;
  cantidad = 1;
  guardando = false;
  mensajeExito = '';
  mensajeError = '';

  get totalCaloriasDia(): number {
    return this.resumen.reduce((sum, t) => sum + t.totalCalorias, 0);
  }

  get consumoMaximo(): number {
    return this.auth.currentUser?.consumoMaxCalorias ?? 2000;
  }

  get porcentajeConsumo(): number {
    return Math.min(100, Math.round((this.totalCaloriasDia / this.consumoMaximo) * 100));
  }

  get email(): string {
    return this.auth.currentUser?.email ?? '';
  }

  constructor(
    private auth: AuthService,
    private productoService: ProductoService,
    private recetaService: RecetaService,
    private consumoService: ConsumoService
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
    this.cargarRecetas();
  }

  cargarResumen(): void {
    this.cargandoResumen = true;
    this.consumoService.getResumenDia(this.email, this.fechaSeleccionada).subscribe({
      next: (data) => {
        this.resumen = data;
        this.cargandoResumen = false;
      },
      error: () => {
        this.cargandoResumen = false;
      }
    });
  }

  cargarRecetas(): void {
    this.recetaService.getRecetasPorPaciente(this.email).subscribe({
      next: (recetas) => {
        this.recetasDisponibles = recetas;
      }
    });
  }

  buscarProductos(): void {
    if (!this.terminoBusqueda.trim()) return;
    this.buscando = true;
    this.productosEncontrados = [];
    this.itemSeleccionado = null;

    this.productoService.buscar(this.terminoBusqueda).subscribe({
      next: (productos) => {
        this.productosEncontrados = productos;
        this.buscando = false;
      },
      error: () => {
        this.buscando = false;
      }
    });
  }

  seleccionarItem(item: Producto | Receta): void {
    this.itemSeleccionado = item;
    this.cantidad = 1;
  }

  esProducto(item: Producto | Receta | null): item is Producto {
    return item !== null && 'codigoBarras' in item;
  }

  esReceta(item: Producto | Receta | null): item is Receta {
    return item !== null && 'idReceta' in item;
  }

  agregarAlRegistro(): void {
    if (!this.itemSeleccionado) {
      this.mensajeError = 'Seleccione un producto o receta.';
      return;
    }

    const consumo: any = {
      pacienteEmail: this.email,
      fecha: this.fechaSeleccionada,
      tiempoComida: this.tiempoSeleccionado,
      cantidad: this.cantidad,
      productoCodigo: null,
      idReceta: null
    };

    if (this.esProducto(this.itemSeleccionado)) {
      consumo.productoCodigo = this.itemSeleccionado.codigoBarras;
    } else if (this.esReceta(this.itemSeleccionado)) {
      consumo.idReceta = this.itemSeleccionado.idReceta;
    }

    this.guardando = true;
    this.mensajeError = '';

    this.consumoService.registrarConsumo(consumo).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Consumo registrado.';
        this.itemSeleccionado = null;
        this.terminoBusqueda = '';
        this.productosEncontrados = [];
        this.cantidad = 1;
        this.cargarResumen();
        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.mensaje ?? 'Error al registrar.';
      }
    });
  }

  eliminarItem(idConsumo: number): void {
    this.consumoService.eliminarConsumo(idConsumo).subscribe({
      next: () => this.cargarResumen(),
      error: () => {}
    });
  }

  getResumenPorTiempo(tiempo: string): ResumenComida | undefined {
    return this.resumen.find((r) => r.tiempoComida === tiempo);
  }
}
