import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { Admin, AdminService } from './admin.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly KEY = 'nutritec_paciente';

  constructor(private adminService: AdminService) {}

  login(email: string, password: string): Observable<Admin | null> {
    return this.adminService.getAdmins().pipe(
      map((admins) => {
        const user = admins.find(
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

  // register(admin: Admin): Observable<any> {
  //   return this.adminService.crearPaciente(admin).pipe(
  //     tap(() => sessionStorage.setItem(this.KEY, JSON.stringify(paciente)))
  //   );
  // }

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
