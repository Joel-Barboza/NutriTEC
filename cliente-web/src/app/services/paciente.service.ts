import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  private apiUrl = 'https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/paciente'; 

  constructor(private http: HttpClient) {}

  getPacientes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}