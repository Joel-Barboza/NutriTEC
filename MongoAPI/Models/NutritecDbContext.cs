using MongoDB.Driver;
using Microsoft.Extensions.Options;
using MongoAPI.Configurations;
using MongoAPI.Models; // Aquí iría tu modelo 'Retroalimentacion' o 'Foro'

namespace MongoAPI.Data
{
    public class NutritecMongoDbContext
    {
        private readonly IMongoDatabase _database;

        public NutritecMongoDbContext(IOptions<MongoDbSettings> mongoSettings)
        {
            // Inicializa el cliente usando el connection string
            var client = new MongoClient(mongoSettings.Value.ConnectionString);

            // Obtiene la base de datos especificada
            _database = client.GetDatabase(mongoSettings.Value.DatabaseName);
        }

        // En vez de DbSet<T>, MongoDB utiliza IMongoCollection<T>
        // Aquí defines tu colección para el foro de retroalimentación
        public IMongoCollection<Retroalimentacion> Retroalimentaciones =>
            _database.GetCollection<Retroalimentacion>("Retroalimentaciones");

        // Si necesitas agregar más colecciones en el futuro, las declaras igual:
        // public IMongoCollection<OtroModelo> OtraColeccion => _database.GetCollection<OtroModelo>("NombreEnMongo");
    }
}