import { environment } from '../config/environment';

// const BASE_URL = `${environment.sqlApiUrl}/receta`;
const BASE_URL = `https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/receta`;


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

export async function getRecetasPorPaciente(email) {
  const res = await fetch(`${BASE_URL}?email=${encodeURIComponent(email)}`);
  return handle(res);
}

export async function getRecetaPorId(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  return handle(res);
}

export async function crearReceta(dto) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handle(res);
}

export async function actualizarReceta(id, dto) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handle(res);
}

export async function eliminarReceta(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  return handle(res);
}