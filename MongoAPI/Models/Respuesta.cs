namespace MongoAPI.Models
{
    public class Respuesta
    {
        public string Autor { get; set; } = string.Empty; // "Nutricionista" o "Paciente"
        public string Mensaje { get; set; } = string.Empty;
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
    }
}