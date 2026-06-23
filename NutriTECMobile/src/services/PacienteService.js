// import { environment } from '../config/environment';

// const BASE_URL = `${environment.sqlApiUrl}/Paciente`;
const BASE_URL = `https://sqlapi20260610230651-hea3g5bkguh0edd7.eastus2-01.azurewebsites.net/api/Paciente`;

export async function getPacienteByEmail(email) {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(email.trim().toLowerCase())}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Error del servidor (${response.status})`);
  }

  return response.json();
}