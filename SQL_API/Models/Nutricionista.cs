using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("Nutricionista")] 
    public class Nutricionista
    {
        [Key] // Llave primaria
        public string CodigoNutricionista { get; set; } = null!;
        public string Cedula { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string Apellido1 { get; set; } = null!;
        public string Apellido2 { get; set; } = null!;
        public DateTime FechaNacimiento { get; set; }
        public decimal Peso { get; set; }
        public decimal IMC { get; set; }
        public string Direccion { get; set; } = null!;
        public string? Foto { get; set; }
        public string NumeroTarjeta { get; set; } = null!;
        public string TipoCobro { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordEncriptado { get; set; } = null!;
    }
}