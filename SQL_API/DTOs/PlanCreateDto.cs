using System.ComponentModel.DataAnnotations;

namespace SQL_API.DTOs
{
    public class PlanCreateDto
    {
        [Required]
        public string NombrePlan { get; set; } = string.Empty;

        [Required]
        public string NutricionistaCodigo { get; set; } = string.Empty;

        [Required]
        public List<PlanDetalleDto> Detalles { get; set; } = new();
    }

    public class PlanDetalleDto
    {
        [Required]
        public string TiempoComida { get; set; } = string.Empty;

        [Required]
        public string ProductoCodigo { get; set; } = string.Empty;

        public int Porciones { get; set; }
    }
}