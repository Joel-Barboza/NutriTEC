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
        public string TituloHilo { get; set; } = string.Empty; // Ej: "Revisión Registro 14/Junio"
        public string MensajeInicial { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        // Aquí se anidan todas las respuestas de la conversación tipo Reddit
        public List<Respuesta> Conversacion { get; set; } = new List<Respuesta>();
    }
}