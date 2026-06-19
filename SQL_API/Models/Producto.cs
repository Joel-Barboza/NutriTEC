using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("Producto")]
    public class Producto
    {
        [Key]
        public string CodigoBarras { get; set; } = null!;
        public string Descripcion { get; set; } = null!;
        public decimal TamanoPorcion { get; set; }
        public string UnidadMedida { get; set; } = null!;
        public int EnergiaKcal { get; set; }
        public decimal GrasaG { get; set; }
        public decimal SodioMg { get; set; }
        public decimal CarbohidratosG { get; set; }
        public decimal ProteinaG { get; set; }
        public string? Vitaminas { get; set; }
        public decimal CalcioMg { get; set; }
        public decimal HierroMg { get; set; }
        public bool AprobadoPorAdministrador { get; set; } = false;
        public string CreadoPor { get; set; } = null!;
    }
}
