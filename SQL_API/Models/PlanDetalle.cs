using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("PlanDetalle")]
    public class PlanDetalle
    {
        [Key]
        public int IdPlanDetalle { get; set; }

        public int IdPlan { get; set; }

        [Required]
        public string TiempoComida { get; set; } = string.Empty;

        [Required]
        public string ProductoCodigo { get; set; } = string.Empty;

        public int Porciones { get; set; }

        public PlanAlimentacion? PlanAlimentacion { get; set; }

        public Producto? Producto { get; set; }
    }
}