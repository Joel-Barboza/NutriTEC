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

        // GET: api/paciente/{email}
        [HttpGet("{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var paciente = await _context.Pacientes
                .FirstOrDefaultAsync(p => p.Email.ToLower() == email.ToLower());

            if (paciente == null)
                return NotFound(new { mensaje = "Paciente no encontrado." });

            return Ok(paciente);
        }

        // POST: api/paciente
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Paciente nuevoPaciente)
        {
            var existe = await _context.Pacientes
                .AnyAsync(p => p.Email.ToLower() == nuevoPaciente.Email.ToLower());

            if (existe)
                return Conflict(new { mensaje = "Ya existe un paciente con ese correo electrónico." });

            _context.Pacientes.Add(nuevoPaciente);
            await _context.SaveChangesAsync();

            // Crear el primer registro de medidas automáticamente al registrarse
            var primeraMedida = new RegistroMedidas
            {
                PacienteEmail = nuevoPaciente.Email,
                Fecha = DateTime.Today,
                Cintura = nuevoPaciente.Cintura,
                Cuello = nuevoPaciente.Cuello,
                Caderas = nuevoPaciente.Caderas,
                PorcentajeMusculo = nuevoPaciente.PorcentajeMusculo,
                PorcentajeGrasa = nuevoPaciente.PorcentajeGrasa
            };
            _context.RegistroMedidas.Add(primeraMedida);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Paciente registrado con éxito." });
        }

        // PUT: api/paciente/{email}
        [HttpPut("{email}")]
        public async Task<IActionResult> Update(string email, [FromBody] Paciente pacienteActualizado)
        {
            var paciente = await _context.Pacientes
                .FirstOrDefaultAsync(p => p.Email.ToLower() == email.ToLower());

            if (paciente == null)
                return NotFound(new { mensaje = "Paciente no encontrado." });

            paciente.Nombre = pacienteActualizado.Nombre;
            paciente.Apellido1 = pacienteActualizado.Apellido1;
            paciente.Apellido2 = pacienteActualizado.Apellido2;
            paciente.FechaNacimiento = pacienteActualizado.FechaNacimiento;
            paciente.PaisResidencia = pacienteActualizado.PaisResidencia;
            paciente.PesoActual = pacienteActualizado.PesoActual;
            paciente.IMC = pacienteActualizado.IMC;
            paciente.ConsumoMaxCalorias = pacienteActualizado.ConsumoMaxCalorias;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Paciente actualizado con éxito." });
        }

        // DELETE: api/paciente/{email}
        [HttpDelete("{email}")]
        public async Task<IActionResult> Delete(string email)
        {
            var paciente = await _context.Pacientes
                .FirstOrDefaultAsync(p => p.Email.ToLower() == email.ToLower());

            if (paciente == null)
                return NotFound(new { mensaje = "Paciente no encontrado." });

            _context.Pacientes.Remove(paciente);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Paciente eliminado con éxito." });
        }
    }
}
