using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
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
            var nutricionistas = await _context.Nutricionistas.ToListAsync();
            return Ok(nutricionistas);
        }

        // POST: api/nutricionista
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Nutricionista nuevoNutricionista)
        {
            if (nuevoNutricionista == null)
                return BadRequest(new { mensaje = "Debe enviar la información del nutricionista." });

            var tipoCobroNormalizado = NormalizarTipoCobro(nuevoNutricionista.TipoCobro);

            if (tipoCobroNormalizado == null)
            {
                return BadRequest(new
                {
                    mensaje = "Tipo de cobro inválido. Use Semanal, Mensual o Anual."
                });
            }

            nuevoNutricionista.TipoCobro = tipoCobroNormalizado;
            nuevoNutricionista.CodigoNutricionista = nuevoNutricionista.CodigoNutricionista.Trim();
            nuevoNutricionista.Email = nuevoNutricionista.Email.Trim();
            nuevoNutricionista.NumeroTarjeta = nuevoNutricionista.NumeroTarjeta.Trim();

            _context.Nutricionistas.Add(nuevoNutricionista);
            await _context.SaveChangesAsync();

            return Ok(nuevoNutricionista);
        }

        private static string? NormalizarTipoCobro(string? tipoCobro)
        {
            var tipo = (tipoCobro ?? string.Empty).Trim().ToUpperInvariant();

            return tipo switch
            {
                "SEMANAL" or "SEMANALES" => "Semanal",
                "MENSUAL" or "MENSUALES" => "Mensual",
                "ANUAL" or "ANUALES" => "Anual",
                _ => null
            };
        }

        // =========================================================
        // RUTA DE PRUEBA
        // Abrir en navegador:
        // https://TU_API.azurewebsites.net/api/nutricionista/pacientes-test
        // Si devuelve JSON, el backend publicado ya tiene esta versión.
        // =========================================================
        [HttpGet("pacientes-test")]
        public IActionResult PacientesTest()
        {
            return Ok(new
            {
                mensaje = "OK: rutas de búsqueda y asociación de pacientes publicadas correctamente.",
                rutasPrincipales = new[]
                {
                    "GET api/nutricionista/pacientes-asociados/{codigoNutricionista}",
                    "GET api/nutricionista/buscar-pacientes/{codigoNutricionista}?termino=texto",
                    "POST api/nutricionista/asociar-paciente"
                },
                rutasCompatibles = new[]
                {
                    "GET api/nutricionista/{codigoNutricionista}/pacientes",
                    "GET api/nutricionista/{codigoNutricionista}/pacientes/buscar?termino=texto",
                    "POST api/nutricionista/{codigoNutricionista}/pacientes/{pacienteEmail}"
                }
            });
        }

        // =========================================================
        // RUTAS NUEVAS, MÁS FÁCILES DE PROBAR Y EVITAN CONFUSIONES
        // =========================================================

        // GET: api/nutricionista/pacientes-asociados/NUT-2026-01
        [HttpGet("pacientes-asociados/{codigoNutricionista}")]
        public async Task<IActionResult> GetPacientesAsociadosNuevo(string codigoNutricionista)
        {
            return await ObtenerPacientesAsociados(codigoNutricionista);
        }

        // GET: api/nutricionista/buscar-pacientes/NUT-2026-01?termino=joel
        [HttpGet("buscar-pacientes/{codigoNutricionista}")]
        public async Task<IActionResult> BuscarPacientesNuevo(string codigoNutricionista, [FromQuery] string? termino)
        {
            return await BuscarPacientesInterno(codigoNutricionista, termino);
        }

        // POST: api/nutricionista/asociar-paciente
        // Body JSON:
        // { "codigoNutricionista": "NUT-2026-01", "pacienteEmail": "joel@gmail.com" }
        [HttpPost("asociar-paciente")]
        public async Task<IActionResult> AsociarPacienteNuevo([FromBody] AsociarPacienteRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CodigoNutricionista) || string.IsNullOrWhiteSpace(request.PacienteEmail))
                return BadRequest(new { mensaje = "Debe enviar codigoNutricionista y pacienteEmail." });

            return await AsociarPacienteInterno(request.CodigoNutricionista, request.PacienteEmail);
        }

        // =========================================================
        // RUTAS COMPATIBLES CON EL FRONTEND ANTERIOR
        // =========================================================

        // GET: api/nutricionista/NUT-2026-01/pacientes
        [HttpGet("{codigoNutricionista}/pacientes")]
        public async Task<IActionResult> GetPacientesAsociados(string codigoNutricionista)
        {
            return await ObtenerPacientesAsociados(codigoNutricionista);
        }

        // GET: api/nutricionista/NUT-2026-01/pacientes/buscar?termino=joel
        [HttpGet("{codigoNutricionista}/pacientes/buscar")]
        public async Task<IActionResult> BuscarPacientes(string codigoNutricionista, [FromQuery] string? termino)
        {
            return await BuscarPacientesInterno(codigoNutricionista, termino);
        }

        // POST: api/nutricionista/NUT-2026-01/pacientes/joel%40gmail.com
        [HttpPost("{codigoNutricionista}/pacientes/{pacienteEmail}")]
        public async Task<IActionResult> AsociarPaciente(string codigoNutricionista, string pacienteEmail)
        {
            return await AsociarPacienteInterno(codigoNutricionista, pacienteEmail);
        }

        // =========================================================
        // LÓGICA INTERNA REUTILIZADA POR AMBOS FORMATOS DE RUTAS
        // =========================================================

        private async Task<IActionResult> BuscarPacientesInterno(string codigoNutricionista, string? termino)
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

        private async Task<IActionResult> ObtenerPacientesAsociados(string codigoNutricionista)
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

        private async Task<IActionResult> AsociarPacienteInterno(string codigoNutricionista, string pacienteEmail)
        {
            if (string.IsNullOrWhiteSpace(codigoNutricionista) || string.IsNullOrWhiteSpace(pacienteEmail))
                return BadRequest(new { mensaje = "Debe enviar el código del nutricionista y el correo del paciente." });

            var codigoNormalizado = codigoNutricionista.Trim().ToLower();
            var emailNormalizado = pacienteEmail.Trim().ToLower();

            var nutricionista = await _context.Nutricionistas
                .FirstOrDefaultAsync(n => n.CodigoNutricionista.ToLower() == codigoNormalizado);

            if (nutricionista == null)
                return NotFound(new { mensaje = $"Nutricionista no encontrado: {codigoNutricionista}." });

            var paciente = await _context.Pacientes
                .FirstOrDefaultAsync(p => p.Email.ToLower() == emailNormalizado);

            if (paciente == null)
                return NotFound(new { mensaje = $"Paciente no encontrado: {pacienteEmail}." });

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

            return Ok(new
            {
                mensaje = "Paciente asociado correctamente.",
                pacienteEmail = paciente.Email,
                nutricionistaCodigo = nutricionista.CodigoNutricionista,
                fechaAsociacion = nuevaAsociacion.FechaAsociacion
            });
        }
    }
}
