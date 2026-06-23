import { environment } from '../config/environment';

// const BASE_URL = `${environment.sqlApiUrl}/paciente-nutricionista`;
const BASE_URL = `https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/paciente-nutricionista`;

export async function getNutricionistaDePaciente(email) {
  const res = await fetch(`${BASE_URL}/por-paciente/${encodeURIComponent(email.trim().toLowerCase())}`);

  if (res.status === 404) {
    return null; // el paciente no tiene nutricionista asignado, no es un error
  }
  if (!res.ok) {
    throw new Error(`Error del servidor (${res.status})`);
  }
  return res.json();
}