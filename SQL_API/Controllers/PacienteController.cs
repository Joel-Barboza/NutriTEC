using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
using SQL_API.Models;
using SQL_API.Security;

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
            var pacientes = await _context.Pacientes.AsNoTracking().ToListAsync();
            return Ok(pacientes.Select(ToPacienteSeguro));
        }

        // GET: api/paciente/{email}
        [HttpGet("{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var paciente = await _context.Pacientes
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Email.ToLower() == email.ToLower());

            if (paciente == null)
                return NotFound(new { mensaje = "Paciente no encontrado." });

            return Ok(ToPacienteSeguro(paciente));
        }

        // POST: api/paciente/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { mensaje = "Debe enviar correo y contraseña." });

            var emailNormalizado = request.Email.Trim().ToLower();

            var paciente = await _context.Pacientes
                .FirstOrDefaultAsync(p => p.Email.ToLower() == emailNormalizado);

            if (paciente == null)
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });

            var passwordValida = await ValidarPasswordPacienteAsync(paciente, request.Password);

            if (!passwordValida)
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });

            return Ok(ToPacienteSeguro(paciente));
        }

        // POST: api/paciente
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Paciente nuevoPaciente)
        {
            if (nuevoPaciente == null)
                return BadRequest(new { mensaje = "Debe enviar la información del paciente." });

            if (string.IsNullOrWhiteSpace(nuevoPaciente.Email) || string.IsNullOrWhiteSpace(nuevoPaciente.PasswordEncriptado))
                return BadRequest(new { mensaje = "El correo y la contraseña son obligatorios." });

            nuevoPaciente.Email = nuevoPaciente.Email.Trim();

            var existe = await _context.Pacientes
                .AnyAsync(p => p.Email.ToLower() == nuevoPaciente.Email.ToLower());

            if (existe)
                return Conflict(new { mensaje = "Ya existe un paciente con ese correo electrónico." });

            // Aunque el campo se llame PasswordEncriptado, se guarda un hash PBKDF2 con salt.
            nuevoPaciente.PasswordEncriptado = PasswordSecurity.HashPassword(nuevoPaciente.PasswordEncriptado);

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

            return Ok(ToPacienteSeguro(nuevoPaciente));
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

        private async Task<bool> ValidarPasswordPacienteAsync(Paciente paciente, string passwordIngresado)
        {
            if (PasswordSecurity.VerifyPassword(passwordIngresado, paciente.PasswordEncriptado))
                return true;

            // Compatibilidad con datos viejos: si estaba en texto plano, permite el login una vez
            // y reemplaza inmediatamente el valor por hash.
            if (PasswordSecurity.VerifyLegacyPlainText(passwordIngresado, paciente.PasswordEncriptado))
            {
                paciente.PasswordEncriptado = PasswordSecurity.HashPassword(passwordIngresado);
                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }

        private static object ToPacienteSeguro(Paciente paciente)
        {
            return new
            {
                paciente.Email,
                paciente.Nombre,
                paciente.Apellido1,
                paciente.Apellido2,
                paciente.FechaNacimiento,
                paciente.PaisResidencia,
                paciente.PesoInicial,
                paciente.PesoActual,
                paciente.IMC,
                paciente.Cintura,
                paciente.Cuello,
                paciente.Caderas,
                paciente.PorcentajeMusculo,
                paciente.PorcentajeGrasa,
                paciente.ConsumoMaxCalorias,
                PasswordEncriptado = string.Empty
            };
        }
    }
}
