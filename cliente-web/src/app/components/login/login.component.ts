import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { Paciente, PacienteService } from '../../services/paciente.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  modo: 'login' | 'registro' = 'login';
  paso = 1;

  loginEmail = '';
  loginPassword = '';

  formulario: Paciente = this.formVacio();

  mensaje = '';
  error = '';
  cargando = false;
  emailNoEncontrado = false;
  emailYaRegistrado = false;

  constructor(
    private auth: AuthService,
    private pacienteService: PacienteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn) this.router.navigate(['/dashboard']);
  }

  private formVacio(): Paciente {
    return {
      email: '',
      nombre: '',
      apellido1: '',
      apellido2: '',
      fechaNacimiento: '',
      paisResidencia: '',
      pesoInicial: 0,
      pesoActual: 0,
      imc: 0,
      cintura: 0,
      cuello: 0,
      caderas: 0,
      porcentajeMusculo: 0,
      porcentajeGrasa: 0,
      consumoMaxCalorias: 2000,
      passwordEncriptado: ''
    };
  }

  cambiarModo(modo: 'login' | 'registro'): void {
    this.modo = modo;
    this.error = '';
    this.mensaje = '';
    this.emailNoEncontrado = false;
    this.emailYaRegistrado = false;
    this.paso = 1;
  }

  iniciarSesion(): void {
    this.error = '';
    this.emailNoEncontrado = false;

    if (!this.loginEmail.trim() || !this.loginPassword.trim()) {
      this.error = 'Ingrese su correo y contraseña.';
      return;
    }

    this.cargando = true;
    this.auth.login(this.loginEmail, this.loginPassword).subscribe({
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

  registrarse(): void {
    this.error = '';
    this.emailYaRegistrado = false;

    const f = this.formulario;
    if (!f.nombre || !f.apellido1 || !f.apellido2 || !f.email ||
        !f.fechaNacimiento || !f.paisResidencia || !f.passwordEncriptado) {
      this.error = 'Complete todos los campos obligatorios.';
      return;
    }

    this.cargando = true;

    this.pacienteService.getPacientes().subscribe({
      next: (pacientes) => {
        const existe = pacientes.some(
          (p) => p.email.toLowerCase() === f.email.toLowerCase()
        );

        if (existe) {
          this.cargando = false;
          this.emailYaRegistrado = true;
          this.cdr.detectChanges();
          return;
        }

        // pesoInicial = pesoActual al registrarse
        f.pesoInicial = f.pesoActual;

        this.auth.register(f).subscribe({
          next: () => {
            this.cargando = false;
            this.router.navigate(['/dashboard']);
            this.cdr.detectChanges();
          },
          error: () => {
            this.cargando = false;
            this.error = 'No se pudo crear la cuenta. Verifique los datos.';
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.cargando = false;
        this.error = 'Error al conectar con el servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  siguiente(): void {
    this.error = '';
    if (this.paso === 1) {
      if (!this.formulario.nombre || !this.formulario.apellido1 ||
          !this.formulario.apellido2 || !this.formulario.fechaNacimiento ||
          !this.formulario.paisResidencia) {
        this.error = 'Complete todos los campos de este paso.';
        return;
      }
    }
    if (this.paso === 2) {
      if (!this.formulario.pesoActual || !this.formulario.imc) {
        this.error = 'Complete todos los campos de este paso.';
        return;
      }
    }
    this.paso++;
  }

  anterior(): void {
    if (this.paso > 1) this.paso--;
  }
}
