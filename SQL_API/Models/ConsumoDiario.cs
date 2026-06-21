using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("ConsumoDiario")]
    public class ConsumoDiario
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdConsumo { get; set; }
        public string PacienteEmail { get; set; } = null!;
        public DateTime Fecha { get; set; } = DateTime.Today;
        public string TiempoComida { get; set; } = null!;
        public string? ProductoCodigo { get; set; }
        public int? IdReceta { get; set; }
        public decimal Cantidad { get; set; } = 1;

        public Producto? Producto { get; set; }
        public Receta? Receta { get; set; }
    }
}
