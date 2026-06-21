import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { Producto, ProductoService } from '../../services/producto.service';
import { Receta, RecetaCreateDto, RecetaService } from '../../services/receta.service';

interface Ingrediente {
  productoCodigo: string;
  descripcion: string;
  cantidadPorciones: number;
  caloriasAporte: number;
}

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recetas.component.html',
  styleUrls: ['./recetas.component.css']
})
export class RecetasComponent implements OnInit {
  recetas: Receta[] = [];
  cargando = false;

  // Formulario
  mostrarFormulario = false;
  editandoId: number | null = null;
  nombreReceta = '';
  ingredientes: Ingrediente[] = [];

  // Búsqueda de ingredientes
  terminoBusqueda = '';
  productosEncontrados: Producto[] = [];
  buscandoProducto = false;

  guardando = false;
  mensajeExito = '';
  mensajeError = '';

  get email(): string {
    return this.auth.currentUser?.email ?? '';
  }

  get caloriasTotal(): number {
    return this.ingredientes.reduce((sum, i) => sum + i.caloriasAporte, 0);
  }

  constructor(
    private auth: AuthService,
    private recetaService: RecetaService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.cargarRecetas();
  }

  cargarRecetas(): void {
    this.cargando = true;
    this.recetaService.getRecetasPorPaciente(this.email).subscribe({
      next: (recetas) => {
        this.recetas = recetas;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  abrirFormulario(receta?: Receta): void {
    this.mostrarFormulario = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    if (receta) {
      this.editandoId = receta.idReceta ?? null;
      this.nombreReceta = receta.nombreReceta;
      this.ingredientes = (receta.detalles ?? []).map((d) => ({
        productoCodigo: d.productoCodigo,
        descripcion: d.producto?.descripcion ?? d.productoCodigo,
        cantidadPorciones: d.cantidadPorciones,
        caloriasAporte: (d.producto?.energiaKcal ?? 0) * d.cantidadPorciones
      }));
    } else {
      this.editandoId = null;
      this.nombreReceta = '';
      this.ingredientes = [];
    }
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
    this.terminoBusqueda = '';
    this.productosEncontrados = [];
  }

  buscarProducto(): void {
    if (!this.terminoBusqueda.trim()) return;
    this.buscandoProducto = true;
    this.productoService.buscar(this.terminoBusqueda).subscribe({
      next: (productos) => {
        this.productosEncontrados = productos;
        this.buscandoProducto = false;
      },
      error: () => {
        this.buscandoProducto = false;
      }
    });
  }

  agregarIngrediente(producto: Producto): void {
    const existe = this.ingredientes.find((i) => i.productoCodigo === producto.codigoBarras);
    if (existe) {
      existe.cantidadPorciones += 1;
      existe.caloriasAporte = producto.energiaKcal * existe.cantidadPorciones;
      return;
    }

    this.ingredientes.push({
      productoCodigo: producto.codigoBarras,
      descripcion: producto.descripcion,
      cantidadPorciones: 1,
      caloriasAporte: producto.energiaKcal
    });

    this.terminoBusqueda = '';
    this.productosEncontrados = [];
  }

  actualizarCalorias(ingrediente: Ingrediente, energiaKcal: number): void {
    ingrediente.caloriasAporte = energiaKcal * ingrediente.cantidadPorciones;
  }

  eliminarIngrediente(index: number): void {
    this.ingredientes.splice(index, 1);
  }

  guardarReceta(): void {
    if (!this.nombreReceta.trim()) {
      this.mensajeError = 'Ingrese un nombre para la receta.';
      return;
    }
    if (this.ingredientes.length === 0) {
      this.mensajeError = 'Agregue al menos un ingrediente.';
      return;
    }

    const dto: RecetaCreateDto = {
      nombreReceta: this.nombreReceta,
      creadoPorEmail: this.email,
      ingredientes: this.ingredientes.map((i) => ({
        productoCodigo: i.productoCodigo,
        cantidadPorciones: i.cantidadPorciones
      }))
    };

    this.guardando = true;
    this.mensajeError = '';

    const operacion = this.editandoId
      ? this.recetaService.actualizarReceta(this.editandoId, dto)
      : this.recetaService.crearReceta(dto);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = this.editandoId ? 'Receta actualizada.' : 'Receta creada con éxito.';
        this.cancelarFormulario();
        this.cargarRecetas();
        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.mensaje ?? 'Error al guardar la receta.';
      }
    });
  }

  eliminarReceta(id: number): void {
    if (!confirm('¿Desea eliminar esta receta?')) return;
    this.recetaService.eliminarReceta(id).subscribe({
      next: () => this.cargarRecetas(),
      error: () => {}
    });
  }
}
