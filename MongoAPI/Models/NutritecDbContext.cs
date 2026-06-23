using Microsoft.Extensions.Options;
using MongoAPI.Configurations;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoAPI.Models;

namespace MongoAPI.Data
{
    public class NutritecMongoDbContext
    {
        private readonly IMongoDatabase _database;

        public string DatabaseName { get; }
        public string RetroalimentacionesCollectionName => "Retroalimentaciones";

        public NutritecMongoDbContext(IOptions<MongoDbSettings> mongoSettings)
        {
            if (string.IsNullOrWhiteSpace(mongoSettings.Value.ConnectionString))
                throw new InvalidOperationException("MongoDbSettings:ConnectionString no está configurado.");

            if (string.IsNullOrWhiteSpace(mongoSettings.Value.DatabaseName))
                throw new InvalidOperationException("MongoDbSettings:DatabaseName no está configurado.");

            DatabaseName = mongoSettings.Value.DatabaseName;

            var client = new MongoClient(mongoSettings.Value.ConnectionString);
            _database = client.GetDatabase(DatabaseName);
        }

        public IMongoCollection<Retroalimentacion> Retroalimentaciones =>
            _database.GetCollection<Retroalimentacion>(RetroalimentacionesCollectionName);

        public IMongoCollection<BsonDocument> RetroalimentacionesRaw =>
            _database.GetCollection<BsonDocument>(RetroalimentacionesCollectionName);
    }
}
