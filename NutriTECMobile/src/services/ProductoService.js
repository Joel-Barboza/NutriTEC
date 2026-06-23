import { environment } from '../config/environment';

// const BASE_URL = `${environment.sqlApiUrl}/producto`;
const BASE_URL = `https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/producto`;

async function handle(response) {
  if (!response.ok) {
    let mensaje = `Error del servidor (${response.status})`;
    try {
      const body = await response.json();
      mensaje = body?.mensaje ?? mensaje;
    } catch {}
    throw new Error(mensaje);
  }
  return response.json();
}

export async function getAprobados() {
  const res = await fetch(`${BASE_URL}/aprobados`);
  return handle(res);
}

export async function buscarProductos(termino) {
  const res = await fetch(`${BASE_URL}/buscar?termino=${encodeURIComponent(termino)}`);
  return handle(res);
}

export async function crearProducto(producto) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });
  return handle(res);
}