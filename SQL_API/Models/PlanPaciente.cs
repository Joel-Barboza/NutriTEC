using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("PlanPaciente")]
    public class PlanPaciente
    {
        [Key]
        public int IdAsignacion { get; set; }

        [Required]
        public string PacienteEmail { get; set; } = string.Empty;

        public int IdPlan { get; set; }

        [Required]
        public string NutricionistaCodigo { get; set; } = string.Empty;

        public DateTime FechaInicio { get; set; }

        public DateTime FechaFin { get; set; }

        public DateTime FechaAsignacion { get; set; } = DateTime.Now;

        public Paciente? Paciente { get; set; }

        public PlanAlimentacion? PlanAlimentacion { get; set; }

        public Nutricionista? Nutricionista { get; set; }
    }
}