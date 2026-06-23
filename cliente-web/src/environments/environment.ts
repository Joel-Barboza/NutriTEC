export const environment = {
  production: false,
  sqlApiUrl: 'http://localhost:5274/api',
  // En desarrollo use MongoAPI local para evitar depender de una publicación vieja en Azure.
  mongoApiUrl: 'http://localhost:5067/api'
};
