import { environment } from '../config/environment';

// const BASE_URL = `${environment.sqlApiUrl}/consumodiario`;
const BASE_URL = `https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/consumodiario`;

async function handle(response) {
  if (!response.ok) {
    let mensaje = `Error del servidor (${response.status})`;
    try {
      const body = await response.json();
      mensaje = body?.mensaje ?? mensaje;
    } catch { }
    throw new Error(mensaje);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function getResumenDia(email, fecha) {
  const res = await fetch(
    `${BASE_URL}/resumen?pacienteEmail=${encodeURIComponent(email)}&fecha=${fecha}`
  );
  return handle(res);
}

export async function registrarConsumo(consumo) {
  console.log(consumo)
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consumo),
  });
  return handle(res);
}

export async function eliminarConsumo(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  return handle(res);
}