import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { Paciente, PacienteService } from './paciente.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly KEY = 'nutritec_paciente';

  constructor(private pacienteService: PacienteService) {}

  login(email: string, password: string): Observable<Paciente | null> {
    return this.pacienteService.getPacientes().pipe(
      map((pacientes) => {
        const user = pacientes.find(
          (p) =>
            p.email.trim().toLowerCase() === email.trim().toLowerCase() &&
            p.passwordEncriptado === password
        );
        if (user) {
          sessionStorage.setItem(this.KEY, JSON.stringify(user));
        }
        return user ?? null;
      })
    );
  }

  register(paciente: Paciente): Observable<any> {
    return this.pacienteService.crearPaciente(paciente).pipe(
      tap(() => sessionStorage.setItem(this.KEY, JSON.stringify(paciente)))
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.KEY);
  }

  get currentUser(): Paciente | null {
    const data = sessionStorage.getItem(this.KEY);
    return data ? (JSON.parse(data) as Paciente) : null;
  }

  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }
}
