using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
using SQL_API.Models;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlanPacienteController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public PlanPacienteController(NutritecDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetByNutricionista([FromQuery] string codigo)
        {
            if (string.IsNullOrWhiteSpace(codigo))
                return BadRequest(new { mensaje = "El código del nutricionista es requerido." });

            var asignaciones = await _context.PlanesPacientes
                .Include(a => a.Paciente)
                .Include(a => a.PlanAlimentacion)
                .Where(a => a.NutricionistaCodigo.ToLower() == codigo.ToLower())
                .OrderByDescending(a => a.FechaAsignacion)
                .ToListAsync();

            return Ok(asignaciones);
        }

        // GET: api/PlanPaciente/activo?pacienteEmail=maria@gmail.com&codigo=NUT-2026-01&fecha=2026-06-21
        // Devuelve los planes asignados al paciente que están vigentes para la fecha indicada.
        // Se usa para la pantalla de Seguimiento Paciente del nutricionista.
        [HttpGet("activo")]
        public async Task<IActionResult> GetPlanActivoPorPacienteYFecha(
            [FromQuery] string pacienteEmail,
            [FromQuery] string codigo,
            [FromQuery] DateTime? fecha)
        {
            if (string.IsNullOrWhiteSpace(pacienteEmail))
                return BadRequest(new { mensaje = "El email del paciente es requerido." });

            if (string.IsNullOrWhiteSpace(codigo))
                return BadRequest(new { mensaje = "El código del nutricionista es requerido." });

            var fechaFiltro = (fecha ?? DateTime.Today).Date;
            var pacienteNormalizado = pacienteEmail.Trim().ToLower();
            var codigoNormalizado = codigo.Trim().ToLower();

            var asignaciones = await _context.PlanesPacientes
                .Include(a => a.PlanAlimentacion)
                    .ThenInclude(p => p!.Detalles)
                        .ThenInclude(d => d.Producto)
                .Where(a =>
                    a.PacienteEmail.ToLower() == pacienteNormalizado &&
                    a.NutricionistaCodigo.ToLower() == codigoNormalizado &&
                    a.FechaInicio <= fechaFiltro &&
                    a.FechaFin >= fechaFiltro)
                .OrderByDescending(a => a.FechaAsignacion)
                .ToListAsync();

            var resultado = asignaciones.Select(a =>
            {
                var detalles = a.PlanAlimentacion?.Detalles ?? new List<PlanDetalle>();

                var detallesPorTiempo = detalles
                    .GroupBy(d => d.TiempoComida)
                    .Select(g => new
                    {
                        TiempoComida = g.Key,
                        TotalCalorias = g.Sum(d => (d.Producto?.EnergiaKcal ?? 0) * d.Porciones),
                        Items = g.Select(d => new
                        {
                            d.IdPlanDetalle,
                            d.ProductoCodigo,
                            Nombre = d.Producto?.Descripcion ?? "Producto no encontrado",
                            d.Porciones,
                            Calorias = (d.Producto?.EnergiaKcal ?? 0) * d.Porciones,
                            EnergiaKcal = d.Producto?.EnergiaKcal ?? 0,
                            TamanoPorcion = d.Producto?.TamanoPorcion ?? 0,
                            UnidadMedida = d.Producto?.UnidadMedida ?? ""
                        }).ToList()
                    })
                    .OrderBy(g => OrdenTiempoComida(g.TiempoComida))
                    .ToList();

                return new
                {
                    a.IdAsignacion,
                    a.PacienteEmail,
                    a.NutricionistaCodigo,
                    a.IdPlan,
                    NombrePlan = a.PlanAlimentacion?.NombrePlan ?? "Plan alimenticio",
                    CaloriasTotales = a.PlanAlimentacion?.CaloriasTotales ?? detallesPorTiempo.Sum(g => g.TotalCalorias),
                    FechaInicio = a.FechaInicio,
                    FechaFin = a.FechaFin,
                    FechaAsignacion = a.FechaAsignacion,
                    DetallesPorTiempo = detallesPorTiempo
                };
            });

            return Ok(resultado);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PlanPacienteCreateDto dto)
        {
            if (dto.FechaFin < dto.FechaInicio)
                return BadRequest(new { mensaje = "La fecha fin no puede ser menor que la fecha inicio." });

            var existePaciente = await _context.Pacientes
                .AnyAsync(p => p.Email == dto.PacienteEmail);

            if (!existePaciente)
                return BadRequest(new { mensaje = "El paciente no existe." });

            var existePlan = await _context.PlanesAlimentacion
                .AnyAsync(p => p.IdPlan == dto.IdPlan && p.NutricionistaCodigo == dto.NutricionistaCodigo);

            if (!existePlan)
                return BadRequest(new { mensaje = "El plan no existe o no pertenece al nutricionista." });

            var asignacion = new PlanPaciente
            {
                PacienteEmail = dto.PacienteEmail,
                IdPlan = dto.IdPlan,
                NutricionistaCodigo = dto.NutricionistaCodigo,
                FechaInicio = dto.FechaInicio,
                FechaFin = dto.FechaFin,
                FechaAsignacion = DateTime.Now
            };

            _context.PlanesPacientes.Add(asignacion);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Plan asignado correctamente.", idAsignacion = asignacion.IdAsignacion });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var asignacion = await _context.PlanesPacientes.FindAsync(id);

            if (asignacion == null)
                return NotFound(new { mensaje = "Asignación no encontrada." });

            _context.PlanesPacientes.Remove(asignacion);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Asignación eliminada correctamente." });
        }

        private static int OrdenTiempoComida(string tiempoComida)
        {
            return tiempoComida switch
            {
                "Desayuno" => 1,
                "Merienda Mañana" => 2,
                "Almuerzo" => 3,
                "Merienda Tarde" => 4,
                "Cena" => 5,
                _ => 99
            };
        }
    }
}
