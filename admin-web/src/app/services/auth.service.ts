import { Injectable } from '@angular/core';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { Admin, AdminService } from './admin.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly KEY = 'nutritec_admin';

  constructor(private adminService: AdminService) {}

  login(email: string, password: string): Observable<Admin | null> {
    return this.adminService.login(email, password).pipe(
      tap((user) => sessionStorage.setItem(this.KEY, JSON.stringify(user))),
      catchError((error) => {
        if (error.status === 401) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.KEY);
  }

  get currentUser(): Admin | null {
    const data = sessionStorage.getItem(this.KEY);
    return data ? (JSON.parse(data) as Admin) : null;
  }

  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }
}
