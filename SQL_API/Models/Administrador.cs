using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_API.Models
{
    [Table("Administrador")]
    public class Administrador
    {
        [Key]
        public string Email { get; set; } = null!;
        public string PasswordEncriptado { get; set; } = null!;
    }
}
