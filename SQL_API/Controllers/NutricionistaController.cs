using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.Models;

namespace SQL_API.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class NutricionistaController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public NutricionistaController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/nutricionista
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Equivale a un SELECT * FROM Nutricionista en SQL, mapeado a JSON automáticamente
            var nutricionistas = await _context.Nutricionistas.ToListAsync();
            return Ok(nutricionistas);
        }

        // POST: api/nutricionista (Ejemplo para registrar uno nuevo desde Angular)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Nutricionista nuevoNutricionista)
        {
            _context.Nutricionistas.Add(nuevoNutricionista);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Nutricionista registrado con éxito utilizando EF Core." });
        }
    }
}
