export const environment = {
  production: false,
  sqlApiUrl: 'http://localhost:5274/api',
  // Para probar el POST de feedback, esta URL debe apuntar a una MongoAPI actualizada.
  // Si apunta a Azure y Azure no fue republicado, seguirá saliendo 405 Method Not Allowed.
  mongoApiUrl: 'http://localhost:5067/api'
};
