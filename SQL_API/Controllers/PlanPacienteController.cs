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
    }
}