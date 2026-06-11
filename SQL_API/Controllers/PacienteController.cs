using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.Models;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PacienteController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public PacienteController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/paciente
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Equivale a un SELECT * FROM Paciente en SQL, mapeado a JSON automáticamente
            var pacientes = await _context.Pacientes.ToListAsync();
            return Ok(pacientes);
        }

        //// POST: api/paciente (Ejemplo para registrar uno nuevo desde Angular)
        //[HttpPost]
        //public async Task<IActionResult> Create([FromBody] Paciente nuevoPaciente)
        //{
        //    _context.Pacientes.Add(nuevoPaciente);
        //    await _context.SaveChangesAsync();
        //    return Ok(new { mensaje = "Paciente registrado con éxito utilizando EF Core." });
        //}
    }
}