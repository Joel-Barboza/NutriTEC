using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SQL_API.Models
{
    [Table("RecetaDetalle")]
    public class RecetaDetalle
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRecetaDetalle { get; set; }
        public int IdReceta { get; set; }
        public string ProductoCodigo { get; set; } = null!;
        public decimal CantidadPorciones { get; set; }

        [JsonIgnore]
        public Receta? Receta { get; set; }
        public Producto? Producto { get; set; }
    }
}
