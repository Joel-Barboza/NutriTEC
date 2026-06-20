using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.Models;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public AdminController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/admin
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Equivale a un SELECT * FROM Administrador en SQL, mapeado a JSON automáticamente
            var administradores = await _context.Administradores.ToListAsync();
            return Ok(administradores);
        }
    }
}
