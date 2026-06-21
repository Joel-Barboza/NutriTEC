using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("PacienteNutricionista")]
    public class PacienteNutricionista
    {
        [Key]
        public string PacienteEmail { get; set; } = null!;
        public string NutricionistaCodigo { get; set; } = null!;
        public DateTime FechaAsociacion { get; set; } = DateTime.Today;
    }
}
