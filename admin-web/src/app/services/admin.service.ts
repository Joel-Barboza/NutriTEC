import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Admin {
  email: string;
  passwordEncriptado: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.sqlApiUrl}/admin`;
  // private apiUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/admin';
  // private apiUrl = 'https://localhost:7249/api/admin';

  constructor(private http: HttpClient) { }

  getAdmins(): Observable<Admin[]> {
    return this.http.get<Admin[]>(this.apiUrl);
  }

  getPacienteByEmail(email: string): Observable<Admin> {
    return this.http.get<Admin>(`${this.apiUrl}/${encodeURIComponent(email)}`);
  }

  // crearPaciente(admin: Admin): Observable<any> {
  //   return this.http.post(this.apiUrl, admin);
  // }

  // actualizarPaciente(email: string, admin: Partial<Admin>): Observable<any> {
  //   return this.http.put(`${this.apiUrl}/${encodeURIComponent(email)}`, admin);
  // }
}
