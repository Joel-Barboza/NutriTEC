import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import {
  Nutricionista,
  NutricionistaService
} from '../../services/nutricionista.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  modo: 'login' | 'registro' = 'login';

  // -------------------------
  // Login
  // -------------------------
  loginEmail = '';
  loginPassword = '';

  // -------------------------
  // Registro
  // -------------------------
  formulario: Nutricionista = this.formularioVacio();
  pasoRegistro = 1;

  // -------------------------
  // Estado
  // -------------------------
  mensaje = '';
  error = '';
  cargando = false;

  emailNoEncontrado = false;
  emailYaRegistrado = false;

  constructor(
    private authService: AuthService,
    private nutricionistaService: NutricionistaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }
  }

  private formularioVacio(): Nutricionista {
    return {
      cedula: '',
      nombre: '',
      apellido1: '',
      apellido2: '',
      codigoNutricionista: '',
      fechaNacimiento: '',
      peso: 0,
      imc: 0,
      direccion: '',
      foto: '',
      numeroTarjeta: '',
      tipoCobro: 'Mensual',
      email: '',
      passwordEncriptado: ''
    };
  }

  cambiarModo(modo: 'login' | 'registro'): void {
    this.modo = modo;
    this.error = '';
    this.mensaje = '';
    this.emailNoEncontrado = false;
    this.emailYaRegistrado = false;
  }

  iniciarSesion(): void {
    this.error = '';
    this.emailNoEncontrado = false;

    if (
      !this.loginEmail.trim() ||
      !this.loginPassword.trim()
    ) {
      this.error =
        'Ingrese su correo electrónico y contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.login(
      this.loginEmail,
      this.loginPassword
    ).subscribe({
      next: (user) => {
        this.cargando = false;

        if (user) {
          this.router.navigate(['/dashboard']);
        } else {
          this.emailNoEncontrado = true;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.error = 'Error al conectar con el servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  private normalizarTipoCobro(tipoCobro: string): 'Semanal' | 'Mensual' | 'Anual' | '' {
    const tipo = (tipoCobro ?? '').trim().toUpperCase();

    switch (tipo) {
      case 'SEMANAL':
      case 'SEMANALES':
        return 'Semanal';
      case 'MENSUAL':
      case 'MENSUALES':
        return 'Mensual';
      case 'ANUAL':
      case 'ANUALES':
        return 'Anual';
      default:
        return '';
    }
  }

  registrarse(): void {
    this.error = '';
    this.mensaje = '';
    this.emailYaRegistrado = false;
    this.formulario.tipoCobro = this.normalizarTipoCobro(this.formulario.tipoCobro);

    if (
      !this.formulario.cedula ||
      !this.formulario.nombre ||
      !this.formulario.apellido1 ||
      !this.formulario.apellido2 ||
      !this.formulario.codigoNutricionista ||
      !this.formulario.fechaNacimiento ||
      !this.formulario.peso ||
      !this.formulario.imc ||
      !this.formulario.direccion ||
      !this.formulario.numeroTarjeta ||
      !this.formulario.tipoCobro ||
      !this.formulario.email ||
      !this.formulario.passwordEncriptado
    ) {
      this.error =
        'Complete todos los campos obligatorios.';
      return;
    }

    this.cargando = true;

    this.nutricionistaService.getUsuarios().subscribe({
      next: (nutricionistas) => {

        const existe = nutricionistas.some(
          u =>
            u.email.trim().toLowerCase() ===
            this.formulario.email.trim().toLowerCase()
        );

        if (existe) {
          this.cargando = false;
          this.emailYaRegistrado = true;
          this.cdr.detectChanges();
          return;
        }

        this.authService
          .register(this.formulario)
          .subscribe({
            next: () => {
              this.cargando = false;
              this.router.navigate(['/dashboard']);
              this.cdr.detectChanges();
            },
            error: () => {
              this.cargando = false;
              this.error =
                'No se pudo crear la cuenta.';
              this.cdr.detectChanges();
            }
          });
      },
      error: () => {
        this.cargando = false;
        this.error =
          'Error al conectar con el servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  siguientePaso(): void {
    if (this.pasoRegistro < 3) {
      this.pasoRegistro++;
    }
  }

  pasoAnterior(): void {
    if (this.pasoRegistro > 1) {
      this.pasoRegistro--;
    }
  }
}