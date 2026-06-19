using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("RegistroMedidas")]
    public class RegistroMedidas
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRegistro { get; set; }
        public string PacienteEmail { get; set; } = null!;
        public DateTime Fecha { get; set; }
        public decimal Cintura { get; set; }
        public decimal Cuello { get; set; }
        public decimal Caderas { get; set; }
        public decimal PorcentajeMusculo { get; set; }
        public decimal PorcentajeGrasa { get; set; }
    }
}
