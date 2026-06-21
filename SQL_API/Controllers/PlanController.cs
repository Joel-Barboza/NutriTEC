using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
using SQL_API.Models;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlanController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public PlanController(NutritecDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetByNutricionista([FromQuery] string codigo)
        {
            if (string.IsNullOrWhiteSpace(codigo))
                return BadRequest(new { mensaje = "El código del nutricionista es requerido." });

            var planes = await _context.PlanesAlimentacion
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.Producto)
                .Where(p => p.NutricionistaCodigo.ToLower() == codigo.ToLower())
                .OrderBy(p => p.NombrePlan)
                .ToListAsync();

            return Ok(planes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var plan = await _context.PlanesAlimentacion
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(p => p.IdPlan == id);

            if (plan == null)
                return NotFound(new { mensaje = "Plan no encontrado." });

            return Ok(plan);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PlanCreateDto dto)
        {
            if (!dto.Detalles.Any())
                return BadRequest(new { mensaje = "El plan debe tener al menos un producto." });

            var codigos = dto.Detalles.Select(d => d.ProductoCodigo).ToList();

            var productos = await _context.Productos
                .Where(p => codigos.Contains(p.CodigoBarras) && p.AprobadoPorAdministrador)
                .ToListAsync();

            if (productos.Count != codigos.Distinct().Count())
                return BadRequest(new { mensaje = "Uno o más productos no existen o no están aprobados." });

            var plan = new PlanAlimentacion
            {
                NombrePlan = dto.NombrePlan,
                NutricionistaCodigo = dto.NutricionistaCodigo,
                CaloriasTotales = 0
            };

            foreach (var detalle in dto.Detalles)
            {
                var producto = productos.First(p => p.CodigoBarras == detalle.ProductoCodigo);

                plan.CaloriasTotales += (int)(producto.EnergiaKcal * detalle.Porciones);

                plan.Detalles.Add(new PlanDetalle
                {
                    TiempoComida = detalle.TiempoComida,
                    ProductoCodigo = detalle.ProductoCodigo,
                    Porciones = detalle.Porciones
                });
            }

            _context.PlanesAlimentacion.Add(plan);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Plan creado con éxito.", idPlan = plan.IdPlan });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PlanCreateDto dto)
        {
            var plan = await _context.PlanesAlimentacion
                .Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.IdPlan == id);

            if (plan == null)
                return NotFound(new { mensaje = "Plan no encontrado." });

            var codigos = dto.Detalles.Select(d => d.ProductoCodigo).ToList();

            var productos = await _context.Productos
                .Where(p => codigos.Contains(p.CodigoBarras) && p.AprobadoPorAdministrador)
                .ToListAsync();

            if (productos.Count != codigos.Distinct().Count())
                return BadRequest(new { mensaje = "Uno o más productos no existen o no están aprobados." });

            plan.NombrePlan = dto.NombrePlan;
            plan.NutricionistaCodigo = dto.NutricionistaCodigo;
            plan.CaloriasTotales = 0;

            _context.PlanDetalles.RemoveRange(plan.Detalles);
            plan.Detalles.Clear();

            foreach (var detalle in dto.Detalles)
            {
                var producto = productos.First(p => p.CodigoBarras == detalle.ProductoCodigo);

                plan.CaloriasTotales += (int)(producto.EnergiaKcal * detalle.Porciones);

                plan.Detalles.Add(new PlanDetalle
                {
                    IdPlan = id,
                    TiempoComida = detalle.TiempoComida,
                    ProductoCodigo = detalle.ProductoCodigo,
                    Porciones = detalle.Porciones
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Plan actualizado con éxito." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var plan = await _context.PlanesAlimentacion
                .Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.IdPlan == id);

            if (plan == null)
                return NotFound(new { mensaje = "Plan no encontrado." });

            _context.PlanDetalles.RemoveRange(plan.Detalles);
            _context.PlanesAlimentacion.Remove(plan);

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Plan eliminado." });
        }
    }
}