using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("Paciente")] // Le dice a EF que esta clase mapea a la tabla Paciente
    public class Paciente
    {
        [Key] // Le dice que este campo es la Llave Primaria
        public string Email { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string Apellido1 { get; set; } = null!;
        public string Apellido2 { get; set; } = null!;
        public DateTime FechaNacimiento { get; set; }
        public string PaisResidencia { get; set; } = null!;
        public decimal PesoInicial { get; set; }
        public decimal PesoActual { get; set; }
        public int ConsumoMaxCalorias { get; set; }
        public string PasswordEncriptado { get; set; } = null!;
    }
}