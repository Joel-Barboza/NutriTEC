using Microsoft.EntityFrameworkCore;

namespace SQL_API.Models
{
    public class NutritecDbContext : DbContext
    {
        public NutritecDbContext(DbContextOptions<NutritecDbContext> options) : base(options) { }
        public DbSet<Paciente> Pacientes { get; set; }
        public DbSet<Nutricionista> Nutricionistas { get; set; }
    }
}