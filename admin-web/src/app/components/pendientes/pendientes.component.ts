import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { Producto, PendientesService } from '../../services/pendientes.service';
// import { Producto, ProductoService } from '../../services/aprobacion.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pendientes.component.html',
  styleUrls: ['./pendientes.component.css']
})
export class PendientesComponent implements OnInit {
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
    private pendientesService: PendientesService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.cargarAprobados();
  }

  cargarAprobados(): void {
    this.buscando = true;
    this.pendientesService.getPendientes().subscribe({
      next: (productos) => {
        this.resultados = productos;
        this.buscando = false;
      },
      error: () => {
        this.buscando = false;
      }
    });
  }

  // buscar(): void {
  //   this.sinResultados = false;
  //   if (!this.terminoBusqueda.trim()) {
  //     this.cargarAprobados();
  //     return;
  //   }

  //   this.buscando = true;
  //   this.productoService.buscar(this.terminoBusqueda).subscribe({
  //     next: (productos) => {
  //       this.resultados = productos;
  //       this.sinResultados = productos.length === 0;
  //       this.buscando = false;
  //     },
  //     error: () => {
  //       this.buscando = false;
  //     }
  //   });
  // }

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

    this.pendientesService.crear(p).subscribe({
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

  cargarPendientes(): void {
    this.pendientesService.getPendientes().subscribe({
      next: (data) => {
        console.log('Pendientes cargados:', data);
        this.resultados = data;
      },
      error: (err) => {
        console.error('Error cargando vuelos:', err);
        this.mensajeError = 'No se pudieron cargar los vuelos.';
      }
    });
  }

  aprobarProducto(p: Producto): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    this.pendientesService.aprobar(p.codigoBarras).subscribe({
      next: () => {
        this.mensajeExito = `"${p.descripcion}" fue aprobado.`;
        this.resultados = this.resultados.filter(r => r.codigoBarras !== p.codigoBarras);
      },
      error: () => {
        this.mensajeError = `No se pudo aprobar "${p.descripcion}".`;
      }
    });
  }

  rechazarProducto(p: Producto): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    const confirmado = confirm(`¿Descartar "${p.descripcion}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    this.pendientesService.rechazar(p.codigoBarras).subscribe({
      next: () => {
        this.mensajeExito = `"${p.descripcion}" fue descartado.`;
        this.resultados = this.resultados.filter(r => r.codigoBarras !== p.codigoBarras);
      },
      error: () => {
        this.mensajeError = `No se pudo descartar "${p.descripcion}".`;
      }
    });
  }

}
