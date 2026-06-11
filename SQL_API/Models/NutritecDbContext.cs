using Microsoft.EntityFrameworkCore;

namespace SQL_API.Models
{
    public class NutritecDbContext : DbContext
    {
        public NutritecDbContext(DbContextOptions<NutritecDbContext> options) : base(options) { }

        // Aquí agregas las tablas que vas a usar en tu código
        public DbSet<Paciente> Pacientes { get; set; }
    }
}