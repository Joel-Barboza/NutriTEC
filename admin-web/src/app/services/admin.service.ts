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

  constructor(private http: HttpClient) { }

  getAdmins(): Observable<Admin[]> {
    return this.http.get<Admin[]>(this.apiUrl);
  }

  login(email: string, password: string): Observable<Admin> {
    return this.http.post<Admin>(`${this.apiUrl}/login`, {
      email,
      password
    });
  }

  getPacienteByEmail(email: string): Observable<Admin> {
    return this.http.get<Admin>(`${this.apiUrl}/${encodeURIComponent(email)}`);
  }
}
