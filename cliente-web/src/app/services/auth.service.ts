import { Injectable } from '@angular/core';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { Paciente, PacienteService } from './paciente.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly KEY = 'nutritec_paciente';

  constructor(private pacienteService: PacienteService) {}

  login(email: string, password: string): Observable<Paciente | null> {
    return this.pacienteService.login(email, password).pipe(
      tap((user) => sessionStorage.setItem(this.KEY, JSON.stringify(user))),
      catchError((error) => {
        if (error.status === 401) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  register(paciente: Paciente): Observable<Paciente> {
    return this.pacienteService.crearPaciente(paciente).pipe(
      tap((created) => sessionStorage.setItem(this.KEY, JSON.stringify(created)))
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
