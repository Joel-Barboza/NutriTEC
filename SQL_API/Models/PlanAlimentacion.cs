using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("PlanAlimentacion")]
    public class PlanAlimentacion
    {
        [Key]
        public int IdPlan { get; set; }

        [Required]
        public string NombrePlan { get; set; } = string.Empty;

        [Required]
        public string NutricionistaCodigo { get; set; } = string.Empty;

        public int CaloriasTotales { get; set; }

        public List<PlanDetalle> Detalles { get; set; } = new();
    }
}