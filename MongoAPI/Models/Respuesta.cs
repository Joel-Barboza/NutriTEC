namespace MongoAPI.Models
{
    public class Respuesta
    {
        public string Autor { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
    }
}
