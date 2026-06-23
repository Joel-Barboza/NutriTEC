using System.Text.Json.Serialization;

namespace MongoAPI.DTOs
{
    public class CrearRetroalimentacionDto
    {
        [JsonPropertyName("pacienteId")]
        public string PacienteId { get; set; } = string.Empty;

        [JsonPropertyName("nutricionistaId")]
        public string NutricionistaId { get; set; } = string.Empty;

        [JsonPropertyName("tituloHilo")]
        public string TituloHilo { get; set; } = string.Empty;

        [JsonPropertyName("mensajeInicial")]
        public string MensajeInicial { get; set; } = string.Empty;

        [JsonPropertyName("fechaConsumo")]
        public DateTime? FechaConsumo { get; set; }
    }
}
