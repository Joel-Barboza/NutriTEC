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
  // Búsqueda
  terminoBusqueda = '';
  resultados: Producto[] = [];
  buscando = false;
  sinResultados = false;

  // Nuevo producto
  mostrarFormulario = false;
  guardando = false;
  mensajeExito = '';
  mensajeError = '';

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
        this.buscando = false;
      },
      error: () => {
        this.buscando = false;
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
      }
    });
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.mensajeExito = '';
    this.mensajeError = '';
    if (this.mostrarFormulario) {
      this.nuevoProducto = this.productoVacio();
    }
  }

  crearProducto(): void {
    const p = this.nuevoProducto;
    if (!p.codigoBarras || !p.descripcion || !p.unidadMedida) {
      this.mensajeError = 'Complete los campos obligatorios: código, descripción y unidad.';
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    p.creadoPor = this.auth.currentUser?.email ?? '';

    this.productoService.crear(p).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Producto enviado. Quedará activo una vez que el administrador lo apruebe.';
        this.nuevoProducto = this.productoVacio();
        this.mostrarFormulario = false;
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.mensaje ?? 'Error al crear el producto.';
      }
    });
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
