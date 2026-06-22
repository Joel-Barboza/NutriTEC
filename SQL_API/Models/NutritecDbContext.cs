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
        public DbSet<PlanAlimentacion> PlanesAlimentacion { get; set; }
        public DbSet<PlanDetalle> PlanDetalles { get; set; }
        public DbSet<PlanPaciente> PlanesPacientes { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Producto>()
                .ToTable(tb => tb.HasTrigger("TR_Producto_Aprobacion"));

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

            modelBuilder.Entity<PlanDetalle>()
                .HasOne(pd => pd.PlanAlimentacion)
                .WithMany(p => p.Detalles)
                .HasForeignKey(pd => pd.IdPlan);

            modelBuilder.Entity<PlanDetalle>()
                .HasOne(pd => pd.Producto)
                .WithMany()
                .HasForeignKey(pd => pd.ProductoCodigo);
            // Tabla de asociación entre paciente y nutricionista.
            // En la BD actual PacienteEmail es PRIMARY KEY, por eso se configura así.
            
            modelBuilder.Entity<PacienteNutricionista>()
                .HasKey(pn => pn.PacienteEmail);

            modelBuilder.Entity<PlanPaciente>()
                .HasOne(pp => pp.Paciente)
                .WithMany()
                .HasForeignKey(pp => pp.PacienteEmail);

            modelBuilder.Entity<PlanPaciente>()
                .HasOne(pp => pp.PlanAlimentacion)
                .WithMany()
                .HasForeignKey(pp => pp.IdPlan);

            modelBuilder.Entity<PlanPaciente>()
                .HasOne(pp => pp.Nutricionista)
                .WithMany()
                .HasForeignKey(pp => pp.NutricionistaCodigo);
        }
    }
}
