using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.Models;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConsumoDiarioController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public ConsumoDiarioController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/consumodiario?pacienteEmail=X&fecha=YYYY-MM-DD
        [HttpGet]
        public async Task<IActionResult> GetByPacienteYFecha(
            [FromQuery] string pacienteEmail,
            [FromQuery] DateTime? fecha)
        {
            if (string.IsNullOrWhiteSpace(pacienteEmail))
                return BadRequest(new { mensaje = "El email del paciente es requerido." });

            var fechaFiltro = (fecha ?? DateTime.Today).Date;

            var consumos = await _context.ConsumosDiarios
                .Include(c => c.Producto)
                .Include(c => c.Receta)
                .Where(c =>
                    c.PacienteEmail.ToLower() == pacienteEmail.ToLower() &&
                    c.Fecha == fechaFiltro)
                .OrderBy(c => c.TiempoComida)
                .ToListAsync();

            return Ok(consumos);
        }

        // GET: api/consumodiario/resumen?pacienteEmail=X&fecha=YYYY-MM-DD
        [HttpGet("resumen")]
        public async Task<IActionResult> GetResumen(
            [FromQuery] string pacienteEmail,
            [FromQuery] DateTime? fecha)
        {
            if (string.IsNullOrWhiteSpace(pacienteEmail))
                return BadRequest(new { mensaje = "El email del paciente es requerido." });

            var fechaFiltro = (fecha ?? DateTime.Today).Date;

            var consumos = await _context.ConsumosDiarios
                .Include(c => c.Producto)
                .Include(c => c.Receta)
                .Where(c =>
                    c.PacienteEmail.ToLower() == pacienteEmail.ToLower() &&
                    c.Fecha == fechaFiltro)
                .ToListAsync();

            var resumen = consumos.GroupBy(c => c.TiempoComida).Select(g => new
            {
                TiempoComida = g.Key,
                Items = g.Select(c => new
                {
                    c.IdConsumo,
                    Nombre = c.Producto?.Descripcion ?? c.Receta?.NombreReceta ?? "Desconocido",
                    c.Cantidad,
                    Calorias = c.Producto != null
                        ? (int)(c.Producto.EnergiaKcal * c.Cantidad)
                        : (int)((c.Receta?.CaloriasTotales ?? 0) * c.Cantidad)
                }),
                TotalCalorias = g.Sum(c =>
                    c.Producto != null
                        ? (int)(c.Producto.EnergiaKcal * c.Cantidad)
                        : (int)((c.Receta?.CaloriasTotales ?? 0) * c.Cantidad))
            });

            return Ok(resumen);
        }

        // POST: api/consumodiario
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ConsumoDiario consumo)
        {
            if (consumo.ProductoCodigo == null && consumo.IdReceta == null)
                return BadRequest(new { mensaje = "Debe especificar un producto o una receta." });

            if (consumo.ProductoCodigo != null && consumo.IdReceta != null)
                return BadRequest(new { mensaje = "Solo puede especificar un producto o una receta, no ambos." });

            var pacienteExiste = await _context.Pacientes
                .AnyAsync(p => p.Email.ToLower() == consumo.PacienteEmail.ToLower());

            if (!pacienteExiste)
                return NotFound(new { mensaje = "Paciente no encontrado." });

            if (consumo.ProductoCodigo != null)
            {
                var productoExiste = await _context.Productos
                    .AnyAsync(p => p.CodigoBarras == consumo.ProductoCodigo && p.AprobadoPorAdministrador);
                if (!productoExiste)
                    return NotFound(new { mensaje = "Producto no encontrado o no aprobado." });
            }

            if (consumo.IdReceta != null)
            {
                var recetaExiste = await _context.Recetas
                    .AnyAsync(r => r.IdReceta == consumo.IdReceta && r.CreadoPorEmail.ToLower() == consumo.PacienteEmail.ToLower());
                if (!recetaExiste)
                    return NotFound(new { mensaje = "Receta no encontrada." });
            }

            consumo.Fecha = consumo.Fecha == default ? DateTime.Today : consumo.Fecha.Date;

            _context.ConsumosDiarios.Add(consumo);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Consumo registrado con éxito.", idConsumo = consumo.IdConsumo });
        }

        // DELETE: api/consumodiario/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var consumo = await _context.ConsumosDiarios.FindAsync(id);

            if (consumo == null)
                return NotFound(new { mensaje = "Registro de consumo no encontrado." });

            _context.ConsumosDiarios.Remove(consumo);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Consumo eliminado." });
        }
    }
}
