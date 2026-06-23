using System.Text.Json.Serialization;

namespace MongoAPI.DTOs
{
    public class AgregarRespuestaDto
    {
        [JsonPropertyName("autor")]
        public string Autor { get; set; } = "Paciente";

        [JsonPropertyName("mensaje")]
        public string Mensaje { get; set; } = string.Empty;
    }
}
