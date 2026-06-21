using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.Models;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegistroMedidasController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public RegistroMedidasController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/registromedidas?pacienteEmail=X
        [HttpGet]
        public async Task<IActionResult> GetByPaciente([FromQuery] string pacienteEmail)
        {
            if (string.IsNullOrWhiteSpace(pacienteEmail))
                return BadRequest(new { mensaje = "El email del paciente es requerido." });

            var registros = await _context.RegistroMedidas
                .Where(r => r.PacienteEmail.ToLower() == pacienteEmail.ToLower())
                .OrderBy(r => r.Fecha)
                .ToListAsync();

            return Ok(registros);
        }

        // GET: api/registromedidas/rango?pacienteEmail=X&inicio=YYYY-MM-DD&fin=YYYY-MM-DD
        [HttpGet("rango")]
        public async Task<IActionResult> GetByRango(
            [FromQuery] string pacienteEmail,
            [FromQuery] DateTime inicio,
            [FromQuery] DateTime fin)
        {
            if (string.IsNullOrWhiteSpace(pacienteEmail))
                return BadRequest(new { mensaje = "El email del paciente es requerido." });

            var registros = await _context.RegistroMedidas
                .Where(r =>
                    r.PacienteEmail.ToLower() == pacienteEmail.ToLower() &&
                    r.Fecha >= inicio &&
                    r.Fecha <= fin)
                .OrderBy(r => r.Fecha)
                .ToListAsync();

            return Ok(registros);
        }

        // POST: api/registromedidas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] RegistroMedidas registro)
        {
            var pacienteExiste = await _context.Pacientes
                .AnyAsync(p => p.Email.ToLower() == registro.PacienteEmail.ToLower());

            if (!pacienteExiste)
                return NotFound(new { mensaje = "Paciente no encontrado." });

            var fechaSoloFecha = registro.Fecha.Date;

            var existeHoy = await _context.RegistroMedidas
                .AnyAsync(r =>
                    r.PacienteEmail.ToLower() == registro.PacienteEmail.ToLower() &&
                    r.Fecha == fechaSoloFecha);

            if (existeHoy)
                return Conflict(new { mensaje = "Ya existe un registro de medidas para esta fecha." });

            registro.Fecha = fechaSoloFecha;
            _context.RegistroMedidas.Add(registro);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Medidas registradas con éxito.", idRegistro = registro.IdRegistro });
        }

        // PUT: api/registromedidas/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] RegistroMedidas actualizado)
        {
            var registro = await _context.RegistroMedidas.FindAsync(id);

            if (registro == null)
                return NotFound(new { mensaje = "Registro no encontrado." });

            registro.Cintura = actualizado.Cintura;
            registro.Cuello = actualizado.Cuello;
            registro.Caderas = actualizado.Caderas;
            registro.PorcentajeMusculo = actualizado.PorcentajeMusculo;
            registro.PorcentajeGrasa = actualizado.PorcentajeGrasa;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Medidas actualizadas con éxito." });
        }

        // DELETE: api/registromedidas/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var registro = await _context.RegistroMedidas.FindAsync(id);

            if (registro == null)
                return NotFound(new { mensaje = "Registro no encontrado." });

            _context.RegistroMedidas.Remove(registro);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Registro eliminado." });
        }
    }
}
