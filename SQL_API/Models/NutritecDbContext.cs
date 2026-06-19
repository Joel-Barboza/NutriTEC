using Microsoft.EntityFrameworkCore;

namespace SQL_API.Models
{
    public class NutritecDbContext : DbContext
    {
        public NutritecDbContext(DbContextOptions<NutritecDbContext> options) : base(options) { }

        public DbSet<Paciente> Pacientes { get; set; }
        public DbSet<Nutricionista> Nutricionistas { get; set; }
        public DbSet<Administrador> Administradores { get; set; }
        public DbSet<Producto> Productos { get; set; }
        public DbSet<RegistroMedidas> RegistroMedidas { get; set; }
        public DbSet<Receta> Recetas { get; set; }
        public DbSet<RecetaDetalle> RecetaDetalles { get; set; }
        public DbSet<ConsumoDiario> ConsumosDiarios { get; set; }
        public DbSet<PacienteNutricionista> PacientesNutricionistas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RecetaDetalle>()
                .HasOne(rd => rd.Receta)
                .WithMany(r => r.Detalles)
                .HasForeignKey(rd => rd.IdReceta);

            modelBuilder.Entity<RecetaDetalle>()
                .HasOne(rd => rd.Producto)
                .WithMany()
                .HasForeignKey(rd => rd.ProductoCodigo);

            modelBuilder.Entity<ConsumoDiario>()
                .HasOne(c => c.Producto)
                .WithMany()
                .HasForeignKey(c => c.ProductoCodigo)
                .IsRequired(false);

            modelBuilder.Entity<ConsumoDiario>()
                .HasOne(c => c.Receta)
                .WithMany()
                .HasForeignKey(c => c.IdReceta)
                .IsRequired(false);
        }
    }
}
