using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MongoAPI.Models
{
    public class Retroalimentacion
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string PacienteId { get; set; } = string.Empty;
        public string NutricionistaId { get; set; } = string.Empty;
        public string TituloHilo { get; set; } = string.Empty;
        public string MensajeInicial { get; set; } = string.Empty;
        public DateTime? FechaConsumo { get; set; }
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaUltimaActualizacion { get; set; }
        public List<Respuesta> Conversacion { get; set; } = new List<Respuesta>();
    }
}
