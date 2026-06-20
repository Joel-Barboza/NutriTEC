using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
using SQL_API.Models;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/paciente-nutricionista")]
    public class PacienteNutricionistaController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public PacienteNutricionistaController(NutritecDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // RUTA DE PRUEBA
        // Abrir en navegador:
        // https://TU_API.azurewebsites.net/api/paciente-nutricionista/test
        // Si devuelve JSON, este controller sí está publicado.
        // =========================================================
        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new
            {
                mensaje = "OK: PacienteNutricionistaController está activo.",
                rutas = new[]
                {
                    "GET api/paciente-nutricionista/pacientes-asociados/{codigoNutricionista}",
                    "GET api/paciente-nutricionista/buscar-pacientes/{codigoNutricionista}?termino=texto",
                    "POST api/paciente-nutricionista/asociar"
                }
            });
        }

        // GET: api/paciente-nutricionista/pacientes-asociados/NUT-2026-01
        [HttpGet("pacientes-asociados/{codigoNutricionista}")]
        public async Task<IActionResult> GetPacientesAsociados(string codigoNutricionista)
        {
            if (string.IsNullOrWhiteSpace(codigoNutricionista))
                return BadRequest(new { mensaje = "El código del nutricionista es requerido." });

            var codigoNormalizado = codigoNutricionista.Trim().ToLower();

            var nutricionistaExiste = await _context.Nutricionistas
                .AnyAsync(n => n.CodigoNutricionista.ToLower() == codigoNormalizado);

            if (!nutricionistaExiste)
                return NotFound(new { mensaje = $"Nutricionista no encontrado: {codigoNutricionista}." });

            var pacientes = await (
                from asociacion in _context.PacientesNutricionistas.AsNoTracking()
                join paciente in _context.Pacientes.AsNoTracking()
                    on asociacion.PacienteEmail equals paciente.Email
                where asociacion.NutricionistaCodigo.ToLower() == codigoNormalizado
                orderby asociacion.FechaAsociacion descending, paciente.Nombre
                select new PacienteAsociadoDto
                {
                    PacienteEmail = paciente.Email,
                    NutricionistaCodigo = asociacion.NutricionistaCodigo,
                    FechaAsociacion = asociacion.FechaAsociacion,
                    Nombre = paciente.Nombre,
                    Apellido1 = paciente.Apellido1,
                    Apellido2 = paciente.Apellido2,
                    NombreCompleto = paciente.Nombre + " " + paciente.Apellido1 + " " + paciente.Apellido2,
                    PaisResidencia = paciente.PaisResidencia,
                    PesoActual = paciente.PesoActual,
                    IMC = paciente.IMC,
                    ConsumoMaxCalorias = paciente.ConsumoMaxCalorias
                }
            ).ToListAsync();

            return Ok(pacientes);
        }

        // GET: api/paciente-nutricionista/buscar-pacientes/NUT-2026-01?termino=joel
        [HttpGet("buscar-pacientes/{codigoNutricionista}")]
        public async Task<IActionResult> BuscarPacientes(string codigoNutricionista, [FromQuery] string? termino)
        {
            if (string.IsNullOrWhiteSpace(codigoNutricionista))
                return BadRequest(new { mensaje = "El código del nutricionista es requerido." });

            var codigoNormalizado = codigoNutricionista.Trim().ToLower();

            var nutricionistaExiste = await _context.Nutricionistas
                .AnyAsync(n => n.CodigoNutricionista.ToLower() == codigoNormalizado);

            if (!nutricionistaExiste)
                return NotFound(new { mensaje = $"Nutricionista no encontrado: {codigoNutricionista}." });

            var pacientesQuery = _context.Pacientes.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(termino))
            {
                var filtro = termino.Trim().ToLower();

                pacientesQuery = pacientesQuery.Where(p =>
                    p.Email.ToLower().Contains(filtro) ||
                    p.Nombre.ToLower().Contains(filtro) ||
                    p.Apellido1.ToLower().Contains(filtro) ||
                    p.Apellido2.ToLower().Contains(filtro) ||
                    (p.Nombre + " " + p.Apellido1 + " " + p.Apellido2).ToLower().Contains(filtro));
            }

            var pacientes = await pacientesQuery
                .OrderBy(p => p.Nombre)
                .ThenBy(p => p.Apellido1)
                .Take(50)
                .ToListAsync();

            var emails = pacientes.Select(p => p.Email).ToList();

            var asociaciones = await _context.PacientesNutricionistas
                .AsNoTracking()
                .Where(a => emails.Contains(a.PacienteEmail))
                .ToListAsync();

            var resultado = pacientes.Select(p =>
            {
                var asociacion = asociaciones.FirstOrDefault(a =>
                    a.PacienteEmail.ToLower() == p.Email.ToLower());

                return new PacienteBusquedaDto
                {
                    Email = p.Email,
                    Nombre = p.Nombre,
                    Apellido1 = p.Apellido1,
                    Apellido2 = p.Apellido2,
                    NombreCompleto = $"{p.Nombre} {p.Apellido1} {p.Apellido2}",
                    PaisResidencia = p.PaisResidencia,
                    PesoActual = p.PesoActual,
                    IMC = p.IMC,
                    ConsumoMaxCalorias = p.ConsumoMaxCalorias,
                    AsociadoAlNutricionista = asociacion != null &&
                        asociacion.NutricionistaCodigo.ToLower() == codigoNormalizado,
                    NutricionistaActualCodigo = asociacion?.NutricionistaCodigo,
                    FechaAsociacion = asociacion?.FechaAsociacion
                };
            }).ToList();

            return Ok(resultado);
        }

        // POST: api/paciente-nutricionista/asociar
        // Body JSON:
        // {
        //   "codigoNutricionista": "NUT-2026-01",
        //   "pacienteEmail": "joel@gmail.com"
        // }
        [HttpPost("asociar")]
        public async Task<IActionResult> AsociarPaciente([FromBody] AsociarPacienteRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.CodigoNutricionista) ||
                string.IsNullOrWhiteSpace(request.PacienteEmail))
            {
                return BadRequest(new { mensaje = "Debe enviar codigoNutricionista y pacienteEmail." });
            }

            var codigoNormalizado = request.CodigoNutricionista.Trim().ToLower();
            var emailNormalizado = request.PacienteEmail.Trim().ToLower();

            var nutricionista = await _context.Nutricionistas
                .FirstOrDefaultAsync(n => n.CodigoNutricionista.ToLower() == codigoNormalizado);

            if (nutricionista == null)
                return NotFound(new { mensaje = $"Nutricionista no encontrado: {request.CodigoNutricionista}." });

            var paciente = await _context.Pacientes
                .FirstOrDefaultAsync(p => p.Email.ToLower() == emailNormalizado);

            if (paciente == null)
                return NotFound(new { mensaje = $"Paciente no encontrado: {request.PacienteEmail}." });

            var asociacionExistente = await _context.PacientesNutricionistas
                .FirstOrDefaultAsync(a => a.PacienteEmail.ToLower() == paciente.Email.ToLower());

            if (asociacionExistente != null)
            {
                if (asociacionExistente.NutricionistaCodigo.ToLower() == nutricionista.CodigoNutricionista.ToLower())
                    return Conflict(new { mensaje = "Este paciente ya está asociado a su lista de pacientes." });

                return Conflict(new
                {
                    mensaje = $"Este paciente ya está asociado al nutricionista {asociacionExistente.NutricionistaCodigo}."
                });
            }

            var nuevaAsociacion = new PacienteNutricionista
            {
                PacienteEmail = paciente.Email,
                NutricionistaCodigo = nutricionista.CodigoNutricionista,
                FechaAsociacion = DateTime.Today
            };

            _context.PacientesNutricionistas.Add(nuevaAsociacion);
            await _context.SaveChangesAsync();

            return Ok(new AsociacionPacienteResponseDto
            {
                Mensaje = "Paciente asociado correctamente.",
                PacienteEmail = paciente.Email,
                NutricionistaCodigo = nutricionista.CodigoNutricionista,
                FechaAsociacion = nuevaAsociacion.FechaAsociacion
            });
        }
    }
}
