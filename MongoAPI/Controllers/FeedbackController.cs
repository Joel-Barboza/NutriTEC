using Microsoft.AspNetCore.Mvc;
using MongoAPI.Data;
using MongoAPI.DTOs;
using MongoDB.Bson;
using MongoDB.Driver;

namespace MongoAPI.Controllers
{
    [ApiController]
    [Route("api/feedback")]
    public class FeedbackController : ControllerBase
    {
        private readonly NutritecMongoDbContext _context;
        private readonly ILogger<FeedbackController> _logger;

        public FeedbackController(NutritecMongoDbContext context, ILogger<FeedbackController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ── GET api/feedback/ping ────────────────────────────────────────────
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new
            {
                mensaje = "FeedbackController activo y guardando en MongoDB.",
                version = "feedback-fix-v1",
                database = _context.DatabaseName,
                collection = _context.RetroalimentacionesCollectionName,
                endpoints = new[]
                {
                    "GET  api/feedback",
                    "GET  api/feedback/paciente/{pacienteEmail}",
                    "GET  api/feedback/paciente/{pacienteEmail}/nutricionista/{codigoNutricionista}",
                    "POST api/feedback",
                    "POST api/feedback/{id}/respuesta",
                    "GET  api/feedback/debug/count",
                    "GET  api/feedback/debug/ultimo"
                }
            });
        }

        // ── GET api/feedback/debug/count ────────────────────────────────────
        [HttpGet("debug/count")]
        public async Task<IActionResult> Count()
        {
            var total = await _context.RetroalimentacionesRaw
                .CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);

            return Ok(new
            {
                database = _context.DatabaseName,
                collection = _context.RetroalimentacionesCollectionName,
                total
            });
        }

        // ── GET api/feedback/debug/ultimo ────────────────────────────────────
        [HttpGet("debug/ultimo")]
        public async Task<IActionResult> Ultimo()
        {
            var doc = await _context.RetroalimentacionesRaw
                .Find(FilterDefinition<BsonDocument>.Empty)
                .Sort(Builders<BsonDocument>.Sort
                    .Descending("FechaUltimaActualizacion")
                    .Descending("FechaCreacion"))
                .FirstOrDefaultAsync();

            return Ok(new
            {
                database = _context.DatabaseName,
                collection = _context.RetroalimentacionesCollectionName,
                ultimo = NormalizarDocumento(doc)
            });
        }

        // ── GET api/feedback ─────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var documentos = await _context.RetroalimentacionesRaw
                    .Find(FilterDefinition<BsonDocument>.Empty)
                    .Sort(Builders<BsonDocument>.Sort
                        .Descending("FechaUltimaActualizacion")
                        .Descending("FechaCreacion"))
                    .Limit(300)
                    .ToListAsync();

                return Ok(documentos.Select(d => NormalizarDocumento(d)).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al leer la colección Retroalimentaciones");
                return StatusCode(500, new
                {
                    mensaje = "MongoAPI no pudo leer la colección Retroalimentaciones.",
                    database = _context.DatabaseName,
                    collection = _context.RetroalimentacionesCollectionName,
                    detalle = ex.Message
                });
            }
        }

        // ── GET api/feedback/paciente/{pacienteEmail} ────────────────────────
        [HttpGet("paciente/{pacienteEmail}")]
        public async Task<IActionResult> GetPorPaciente(string pacienteEmail)
        {
            try
            {
                var filtro = CrearFiltroPaciente(pacienteEmail);

                var documentos = await _context.RetroalimentacionesRaw
                    .Find(filtro)
                    .Sort(Builders<BsonDocument>.Sort
                        .Descending("FechaUltimaActualizacion")
                        .Descending("FechaCreacion"))
                    .Limit(300)
                    .ToListAsync();

                return Ok(documentos.Select(d => NormalizarDocumento(d)).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al leer retroalimentación del paciente {Email}", pacienteEmail);
                return StatusCode(500, new
                {
                    mensaje = "MongoAPI no pudo cargar la retroalimentación del paciente.",
                    detalle = ex.Message
                });
            }
        }

        // ── GET api/feedback/paciente/{pacienteEmail}/nutricionista/{codigo} ──
        [HttpGet("paciente/{pacienteEmail}/nutricionista/{codigoNutricionista}")]
        public async Task<IActionResult> GetPorPacienteYNutricionista(
            string pacienteEmail, string codigoNutricionista)
        {
            try
            {
                var documentos = await _context.RetroalimentacionesRaw
                    .Find(Builders<BsonDocument>.Filter.And(
                        CrearFiltroPaciente(pacienteEmail),
                        CrearFiltroNutricionista(codigoNutricionista)
                    ))
                    .Sort(Builders<BsonDocument>.Sort
                        .Descending("FechaUltimaActualizacion")
                        .Descending("FechaCreacion"))
                    .Limit(300)
                    .ToListAsync();

                return Ok(documentos.Select(d => NormalizarDocumento(d)).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al filtrar por paciente/nutricionista");
                return StatusCode(500, new
                {
                    mensaje = "MongoAPI no pudo cargar la retroalimentación filtrada.",
                    detalle = ex.Message
                });
            }
        }

        // ── POST api/feedback ────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearRetroalimentacionDto dto)
        {
            // Si el DTO llega null generalmente es un problema de Content-Type
            if (dto == null)
                return BadRequest(new { mensaje = "El cuerpo de la petición es obligatorio. Asegúrese de enviar Content-Type: application/json." });

            if (string.IsNullOrWhiteSpace(dto.PacienteId))
                return BadRequest(new { mensaje = "PacienteId es obligatorio." });

            if (string.IsNullOrWhiteSpace(dto.NutricionistaId))
                return BadRequest(new { mensaje = "NutricionistaId es obligatorio." });

            if (string.IsNullOrWhiteSpace(dto.MensajeInicial))
                return BadRequest(new { mensaje = "MensajeInicial es obligatorio." });

            try
            {
                var ahora = DateTime.UtcNow;
                var mensaje = dto.MensajeInicial.Trim();
                var titulo = string.IsNullOrWhiteSpace(dto.TituloHilo)
                    ? $"Seguimiento {DateTime.Now:dd/MM/yyyy HH:mm}"
                    : dto.TituloHilo.Trim();

                var documento = new BsonDocument
                {
                    { "PacienteId",    dto.PacienteId.Trim() },
                    { "NutricionistaId", dto.NutricionistaId.Trim() },
                    { "TituloHilo",    titulo },
                    { "MensajeInicial", mensaje },
                    { "FechaCreacion", ahora },
                    { "FechaUltimaActualizacion", ahora },
                    { "Conversacion", new BsonArray
                        {
                            new BsonDocument
                            {
                                { "Autor",   "Nutricionista" },
                                { "Mensaje", mensaje },
                                { "Fecha",   ahora }
                            }
                        }
                    }
                };

                if (dto.FechaConsumo.HasValue)
                    documento.Add("FechaConsumo", dto.FechaConsumo.Value.Date);

                await _context.RetroalimentacionesRaw.InsertOneAsync(documento);

                // Verificar que quedó guardado
                var idInsertado = ObtenerId(documento);
                var guardado = await _context.RetroalimentacionesRaw
                    .Find(CrearFiltroPorId(idInsertado))
                    .FirstOrDefaultAsync();

                if (guardado == null)
                {
                    _logger.LogWarning("Inserción ejecutada pero documento no encontrado con _id {Id}", idInsertado);
                    return StatusCode(500, new
                    {
                        mensaje = "La inserción se ejecutó, pero no se pudo verificar el documento en MongoDB.",
                        id = idInsertado
                    });
                }

                Response.Headers["X-NutriTEC-Mongo-Database"]   = _context.DatabaseName;
                Response.Headers["X-NutriTEC-Mongo-Collection"] = _context.RetroalimentacionesCollectionName;
                Response.Headers["X-NutriTEC-Mongo-InsertedId"] = ObtenerId(guardado);

                _logger.LogInformation("Retroalimentación guardada en MongoDB con _id {Id}", ObtenerId(guardado));

                return Ok(NormalizarDocumento(guardado, guardadoEnMongo: true));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar retroalimentación en MongoDB. DTO: PacienteId={P} NutricionistaId={N}",
                    dto.PacienteId, dto.NutricionistaId);

                return StatusCode(500, new
                {
                    mensaje = "MongoAPI no pudo guardar la retroalimentación en MongoDB.",
                    database = _context.DatabaseName,
                    collection = _context.RetroalimentacionesCollectionName,
                    detalle = ex.Message
                });
            }
        }

        // ── POST api/feedback/{id}/respuesta ─────────────────────────────────
        [HttpPost("{id}/respuesta")]
        public async Task<IActionResult> AgregarRespuesta(string id, [FromBody] AgregarRespuestaDto dto)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest(new { mensaje = "El id del hilo es obligatorio." });

            if (dto == null || string.IsNullOrWhiteSpace(dto.Mensaje))
                return BadRequest(new { mensaje = "El mensaje de respuesta es obligatorio." });

            try
            {
                var filtro = CrearFiltroPorId(id);
                var ahora  = DateTime.UtcNow;
                var autor  = string.IsNullOrWhiteSpace(dto.Autor) ? "Paciente" : dto.Autor.Trim();

                var respuesta = new BsonDocument
                {
                    { "Autor",   autor },
                    { "Mensaje", dto.Mensaje.Trim() },
                    { "Fecha",   ahora }
                };

                var update = Builders<BsonDocument>.Update
                    .Push("Conversacion", respuesta)
                    .Set("FechaUltimaActualizacion", ahora);

                var resultado = await _context.RetroalimentacionesRaw.UpdateOneAsync(filtro, update);

                if (resultado.MatchedCount == 0)
                    return NotFound(new { mensaje = "No se encontró el hilo de retroalimentación con ese id." });

                var actualizado = await _context.RetroalimentacionesRaw.Find(filtro).FirstOrDefaultAsync();

                Response.Headers["X-NutriTEC-Mongo-Database"]   = _context.DatabaseName;
                Response.Headers["X-NutriTEC-Mongo-Collection"] = _context.RetroalimentacionesCollectionName;
                Response.Headers["X-NutriTEC-Mongo-UpdatedId"]  = ObtenerId(actualizado ?? new BsonDocument());

                return Ok(NormalizarDocumento(actualizado, guardadoEnMongo: true));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al agregar respuesta al hilo {Id}", id);
                return StatusCode(500, new
                {
                    mensaje = "MongoAPI no pudo guardar la respuesta.",
                    detalle = ex.Message
                });
            }
        }

        // ── Helpers privados ──────────────────────────────────────────────────

        private static FilterDefinition<BsonDocument> CrearFiltroPaciente(string pacienteEmail)
        {
            var email = (pacienteEmail ?? string.Empty).Trim();
            return Builders<BsonDocument>.Filter.Regex(
                "PacienteId", new BsonRegularExpression($"^{EscapeRegex(email)}$", "i"));
        }

        private static FilterDefinition<BsonDocument> CrearFiltroNutricionista(string codigoNutricionista)
        {
            var codigo = (codigoNutricionista ?? string.Empty).Trim();
            return Builders<BsonDocument>.Filter.Regex(
                "NutricionistaId", new BsonRegularExpression($"^{EscapeRegex(codigo)}$", "i"));
        }

        private static FilterDefinition<BsonDocument> CrearFiltroPorId(string id)
        {
            if (ObjectId.TryParse(id, out var objectId))
                return Builders<BsonDocument>.Filter.Eq("_id", objectId);

            return Builders<BsonDocument>.Filter.Eq("_id", id);
        }

        private object NormalizarDocumento(BsonDocument? documento, bool guardadoEnMongo = false)
        {
            documento ??= new BsonDocument();

            return new
            {
                id                       = ObtenerId(documento),
                pacienteId               = ObtenerString(documento, "PacienteId"),
                nutricionistaId          = ObtenerString(documento, "NutricionistaId"),
                tituloHilo               = ObtenerString(documento, "TituloHilo"),
                mensajeInicial           = ObtenerString(documento, "MensajeInicial"),
                fechaConsumo             = ObtenerFecha(documento, "FechaConsumo"),
                fechaCreacion            = ObtenerFecha(documento, "FechaCreacion") ?? DateTime.UtcNow,
                fechaUltimaActualizacion = ObtenerFecha(documento, "FechaUltimaActualizacion"),
                conversacion             = ObtenerConversacion(documento),
                guardadoEnMongo,
                mongoDatabase            = _context.DatabaseName,
                mongoCollection          = _context.RetroalimentacionesCollectionName
            };
        }

        private static string ObtenerId(BsonDocument documento)
        {
            if (!documento.TryGetValue("_id", out var valor) || valor.IsBsonNull)
                return string.Empty;

            return valor.IsObjectId ? valor.AsObjectId.ToString() : valor.ToString();
        }

        private static string ObtenerString(BsonDocument documento, string nombre)
        {
            if (!documento.TryGetValue(nombre, out var valor) || valor.IsBsonNull)
                return string.Empty;

            return valor.IsString ? valor.AsString : valor.ToString();
        }

        private static DateTime? ObtenerFecha(BsonDocument documento, string nombre)
        {
            if (!documento.TryGetValue(nombre, out var valor) || valor.IsBsonNull)
                return null;

            if (valor.BsonType == BsonType.DateTime)
                return valor.ToUniversalTime();

            if (valor.IsString && DateTime.TryParse(valor.AsString, out var fecha))
                return fecha;

            return null;
        }

        private static List<object> ObtenerConversacion(BsonDocument documento)
        {
            if (!documento.TryGetValue("Conversacion", out var valor) || !valor.IsBsonArray)
                return new List<object>();

            return valor.AsBsonArray
                .Where(item => item.IsBsonDocument)
                .Select(item =>
                {
                    var msg = item.AsBsonDocument;
                    return (object)new
                    {
                        autor   = ObtenerString(msg, "Autor"),
                        mensaje = ObtenerString(msg, "Mensaje"),
                        fecha   = ObtenerFecha(msg, "Fecha") ?? DateTime.UtcNow
                    };
                })
                .ToList();
        }

        private static string EscapeRegex(string value) =>
            System.Text.RegularExpressions.Regex.Escape(value ?? string.Empty);
    }
}
