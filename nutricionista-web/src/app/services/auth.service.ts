import { Injectable } from '@angular/core';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { Nutricionista, NutricionistaService } from './nutricionista.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly KEY = 'nutritec_user';

  constructor(private nutricionistaService: NutricionistaService) {}

  login(email: string, password: string): Observable<Nutricionista | null> {
    return this.nutricionistaService.login(email, password).pipe(
      tap((user) => sessionStorage.setItem(this.KEY, JSON.stringify(user))),
      catchError((error) => {
        if (error.status === 401) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  register(nutricionista: Nutricionista): Observable<Nutricionista> {
    return this.nutricionistaService
      .crearUsuario(nutricionista)
      .pipe(
        tap((created) =>
          sessionStorage.setItem(
            this.KEY,
            JSON.stringify(created)
          )
        )
      );
  }

  logout(): void {
    sessionStorage.removeItem(this.KEY);
  }

  get currentUser(): Nutricionista | null {
    const data = sessionStorage.getItem(this.KEY);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as Nutricionista;
  }

  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }
}
