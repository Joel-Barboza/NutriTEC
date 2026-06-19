using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
using SQL_API.Models;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecetaController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public RecetaController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/receta?email=X
        [HttpGet]
        public async Task<IActionResult> GetByPaciente([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { mensaje = "El email es requerido." });

            var recetas = await _context.Recetas
                .Include(r => r.Detalles)
                    .ThenInclude(d => d.Producto)
                .Where(r => r.CreadoPorEmail.ToLower() == email.ToLower())
                .OrderBy(r => r.NombreReceta)
                .ToListAsync();

            return Ok(recetas);
        }

        // GET: api/receta/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var receta = await _context.Recetas
                .Include(r => r.Detalles)
                    .ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(r => r.IdReceta == id);

            if (receta == null)
                return NotFound(new { mensaje = "Receta no encontrada." });

            return Ok(receta);
        }

        // POST: api/receta
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] RecetaCreateDto dto)
        {
            if (!dto.Ingredientes.Any())
                return BadRequest(new { mensaje = "La receta debe tener al menos un ingrediente." });

            // Obtener los productos para calcular los totales
            var codigos = dto.Ingredientes.Select(i => i.ProductoCodigo).ToList();
            var productos = await _context.Productos
                .Where(p => codigos.Contains(p.CodigoBarras) && p.AprobadoPorAdministrador)
                .ToListAsync();

            if (productos.Count != codigos.Distinct().Count())
                return BadRequest(new { mensaje = "Uno o más productos no existen o no están aprobados." });

            var receta = new Receta
            {
                NombreReceta = dto.NombreReceta,
                CreadoPorEmail = dto.CreadoPorEmail
            };

            foreach (var ingrediente in dto.Ingredientes)
            {
                var producto = productos.First(p => p.CodigoBarras == ingrediente.ProductoCodigo);
                receta.CaloriasTotales += (int)(producto.EnergiaKcal * ingrediente.CantidadPorciones);
                receta.CarbohidratosTotales += producto.CarbohidratosG * ingrediente.CantidadPorciones;
                receta.ProteinasTotales += producto.ProteinaG * ingrediente.CantidadPorciones;
                receta.GrasasTotales += producto.GrasaG * ingrediente.CantidadPorciones;

                receta.Detalles.Add(new RecetaDetalle
                {
                    ProductoCodigo = ingrediente.ProductoCodigo,
                    CantidadPorciones = ingrediente.CantidadPorciones
                });
            }

            _context.Recetas.Add(receta);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Receta creada con éxito.", idReceta = receta.IdReceta });
        }

        // PUT: api/receta/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] RecetaCreateDto dto)
        {
            var receta = await _context.Recetas
                .Include(r => r.Detalles)
                .FirstOrDefaultAsync(r => r.IdReceta == id);

            if (receta == null)
                return NotFound(new { mensaje = "Receta no encontrada." });

            var codigos = dto.Ingredientes.Select(i => i.ProductoCodigo).ToList();
            var productos = await _context.Productos
                .Where(p => codigos.Contains(p.CodigoBarras) && p.AprobadoPorAdministrador)
                .ToListAsync();

            if (productos.Count != codigos.Distinct().Count())
                return BadRequest(new { mensaje = "Uno o más productos no existen o no están aprobados." });

            receta.NombreReceta = dto.NombreReceta;
            receta.CaloriasTotales = 0;
            receta.CarbohidratosTotales = 0;
            receta.ProteinasTotales = 0;
            receta.GrasasTotales = 0;

            _context.RecetaDetalles.RemoveRange(receta.Detalles);
            receta.Detalles.Clear();

            foreach (var ingrediente in dto.Ingredientes)
            {
                var producto = productos.First(p => p.CodigoBarras == ingrediente.ProductoCodigo);
                receta.CaloriasTotales += (int)(producto.EnergiaKcal * ingrediente.CantidadPorciones);
                receta.CarbohidratosTotales += producto.CarbohidratosG * ingrediente.CantidadPorciones;
                receta.ProteinasTotales += producto.ProteinaG * ingrediente.CantidadPorciones;
                receta.GrasasTotales += producto.GrasaG * ingrediente.CantidadPorciones;

                receta.Detalles.Add(new RecetaDetalle
                {
                    IdReceta = id,
                    ProductoCodigo = ingrediente.ProductoCodigo,
                    CantidadPorciones = ingrediente.CantidadPorciones
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Receta actualizada con éxito." });
        }

        // DELETE: api/receta/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var receta = await _context.Recetas.FindAsync(id);

            if (receta == null)
                return NotFound(new { mensaje = "Receta no encontrada." });

            _context.Recetas.Remove(receta);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Receta eliminada." });
        }
    }
}
