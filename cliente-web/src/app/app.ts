import { Component, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PacienteService } from './services/paciente.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  providers: [PacienteService],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  listaPacientes: any[] = [];

  constructor(@Inject(PacienteService) private pacienteService: PacienteService) {}

  cargarUsuarios() {
    this.pacienteService.getPacientes().subscribe({
      next: (data) => {
        this.listaPacientes = data;
        console.log("Datos recibidos de la BD:", data);
      },
      error: (err) => {
        console.error("Error de conexión API -> Angular:", err);
      }
    });
  }

  calcularEdad(fechaNacimientoStr: string): number {
    if (!fechaNacimientoStr) return 0;
    
    const nacimiento = new Date(fechaNacimientoStr);
    const hoy = new Date();
    
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();
    
    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }
}
