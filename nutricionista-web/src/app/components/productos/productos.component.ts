import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { Producto, ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  terminoBusqueda = '';
  resultados: Producto[] = [];
  buscando = false;
  sinResultados = false;

  mostrarFormulario = false;
  guardando = false;
  mensajeExito = '';
  mensajeError = '';

  editando = false;
  codigoEditando = '';

  nuevoProducto: Producto = this.productoVacio();

  constructor(
    private productoService: ProductoService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarAprobados();
  }

  cargarAprobados(): void {
    this.buscando = true;
    this.productoService.getAprobados().subscribe({
      next: (productos) => {
        this.resultados = productos;
        this.sinResultados = productos.length === 0;
        this.buscando = false;
      },
      error: () => {
        this.buscando = false;
        this.mensajeError = 'Error al cargar productos.';
      }
    });
  }

  buscar(): void {
    this.sinResultados = false;

    if (!this.terminoBusqueda.trim()) {
      this.cargarAprobados();
      return;
    }

    this.buscando = true;
    this.productoService.buscar(this.terminoBusqueda).subscribe({
      next: (productos) => {
        this.resultados = productos;
        this.sinResultados = productos.length === 0;
        this.buscando = false;
      },
      error: () => {
        this.buscando = false;
        this.mensajeError = 'Error al buscar productos.';
      }
    });
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.mostrarFormulario) {
      this.cancelarEdicion();
      this.nuevoProducto = this.productoVacio();
    }
  }

  guardarProducto(): void {
    if (this.editando) {
      this.actualizarProducto();
    } else {
      this.crearProducto();
    }
  }

  crearProducto(): void {
    const p = this.nuevoProducto;

    if (!this.validarProducto(p)) return;

    this.guardando = true;
    this.mensajeError = '';
    p.creadoPor = this.auth.currentUser?.email ?? '';

    this.productoService.crear(p).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Producto enviado. Quedará activo una vez que el administrador lo apruebe.';
        this.nuevoProducto = this.productoVacio();
        this.mostrarFormulario = false;
        this.cargarAprobados();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.mensaje ?? 'Error al crear el producto.';
      }
    });
  }

  editarProducto(producto: Producto): void {
    this.mostrarFormulario = true;
    this.editando = true;
    this.codigoEditando = producto.codigoBarras;
    this.mensajeExito = '';
    this.mensajeError = '';

    this.nuevoProducto = {
      ...producto
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  actualizarProducto(): void {
    const p = this.nuevoProducto;

    if (!this.codigoEditando) {
      this.mensajeError = 'No se encontró el código del producto a editar.';
      return;
    }

    if (!this.validarProducto(p)) return;

    this.guardando = true;
    this.mensajeError = '';

    this.productoService.actualizar(this.codigoEditando, p).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Producto actualizado correctamente.';
        this.cancelarEdicion();
        this.mostrarFormulario = false;
        this.cargarAprobados();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.mensaje ?? 'Error al actualizar el producto.';
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    if (!confirm(`¿Seguro que desea eliminar el producto "${producto.descripcion}"?`)) {
      return;
    }

    this.mensajeExito = '';
    this.mensajeError = '';

    this.productoService.eliminar(producto.codigoBarras).subscribe({
      next: () => {
        this.mensajeExito = 'Producto eliminado correctamente.';
        this.cargarAprobados();
      },
      error: (err) => {
        this.mensajeError = err?.error?.mensaje ?? 'Error al eliminar el producto.';
      }
    });
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.codigoEditando = '';
    this.nuevoProducto = this.productoVacio();
  }

  private validarProducto(p: Producto): boolean {
    if (!p.codigoBarras || !p.descripcion || !p.unidadMedida) {
      this.mensajeError = 'Complete los campos obligatorios: código, descripción y unidad.';
      return false;
    }

    if (
      p.tamanoPorcion <= 0 ||
      p.energiaKcal < 0 ||
      p.grasaG < 0 ||
      p.sodioMg < 0 ||
      p.carbohidratosG < 0 ||
      p.proteinaG < 0 ||
      p.calcioMg < 0 ||
      p.hierroMg < 0
    ) {
      this.mensajeError = 'Los valores nutricionales no pueden ser negativos y la porción debe ser mayor a cero.';
      return false;
    }

    return true;
  }

  private productoVacio(): Producto {
    return {
      codigoBarras: '',
      descripcion: '',
      tamanoPorcion: 100,
      unidadMedida: 'g',
      energiaKcal: 0,
      grasaG: 0,
      sodioMg: 0,
      carbohidratosG: 0,
      proteinaG: 0,
      vitaminas: '',
      calcioMg: 0,
      hierroMg: 0,
      aprobadoPorAdministrador: false,
      creadoPor: ''
    };
  }
}