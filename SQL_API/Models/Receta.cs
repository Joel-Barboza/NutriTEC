using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("Receta")]
    public class Receta
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdReceta { get; set; }
        public string NombreReceta { get; set; } = null!;
        public string CreadoPorEmail { get; set; } = null!;
        public int CaloriasTotales { get; set; } = 0;
        public decimal CarbohidratosTotales { get; set; } = 0;
        public decimal ProteinasTotales { get; set; } = 0;
        public decimal GrasasTotales { get; set; } = 0;

        public ICollection<RecetaDetalle> Detalles { get; set; } = new List<RecetaDetalle>();
    }
}
