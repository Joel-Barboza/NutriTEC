import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Respuesta {
  autor: string;
  mensaje: string;
  fecha: string;
}

interface Retroalimentacion {
  id: string;
  pacienteId: string;
  nutricionistaId: string;
  tituloHilo: string;
  mensajeInicial: string;
  fechaCreacion: string;
  conversacion: Respuesta[];
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedBackComponent implements OnInit {
  protected readonly title = signal('Feedback');
  
  // Inyección del servicio HTTP de Angular
  private http = inject(HttpClient);
  
  // URL de tu API en Azure
  private apiUrl = `${environment.mongoApiUrl}/Feedback`;
  // private apiUrl = 'https://mongoapi20260614023630-eugvc7dxf5fqh2cp.eastus2-01.azurewebsites.net/api/Feedback';

  // El signal empieza vacío y con un estado de carga opcional
  protected hilos = signal<Retroalimentacion[]>([]);
  protected cargando = signal<boolean>(true);
  protected errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarRetroalimentaciones();
  }

  protected cargarRetroalimentaciones(): void {
    this.cargando.set(true);
    this.errorMsg.set(null);

    // Consumo del endpoint GET de Azure
    this.http.get<Retroalimentacion[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.hilos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al conectar con la API de Azure:', err);
        this.errorMsg.set('No se pudo establecer conexión con el servidor de Azure.');
        this.cargando.set(false);
      }
    });
  }
}