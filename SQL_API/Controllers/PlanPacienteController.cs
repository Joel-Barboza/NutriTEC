using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
using SQL_API.Models;
using System.Data;
using System.Data.Common;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlanPacienteController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public PlanPacienteController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/PlanPaciente?codigo=NUT-2026-01
        [HttpGet]
        public async Task<IActionResult> GetByNutricionista([FromQuery] string codigo)
        {
            if (string.IsNullOrWhiteSpace(codigo))
                return BadRequest(new { mensaje = "El código del nutricionista es requerido." });

            var connection = _context.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;

            try
            {
                if (shouldClose)
                    await connection.OpenAsync();

                await using var command = connection.CreateCommand();
                command.CommandText = @"
                    SELECT
                        pp.IdAsignacion,
                        pp.PacienteEmail,
                        pp.IdPlan,
                        pp.NutricionistaCodigo,
                        pp.FechaInicio,
                        pp.FechaFin,
                        pp.FechaAsignacion,
                        p.Nombre,
                        p.Apellido1,
                        p.Apellido2,
                        pa.NombrePlan,
                        pa.CaloriasTotales
                    FROM PlanPaciente pp
                    LEFT JOIN Paciente p ON p.Email = pp.PacienteEmail
                    LEFT JOIN PlanAlimentacion pa ON pa.IdPlan = pp.IdPlan
                    WHERE LOWER(pp.NutricionistaCodigo) = LOWER(@codigo)
                    ORDER BY pp.FechaAsignacion DESC;";
                AddParameter(command, "@codigo", codigo.Trim());

                var asignaciones = new List<object>();
                await using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    asignaciones.Add(new
                    {
                        IdAsignacion = GetInt(reader, "IdAsignacion"),
                        PacienteEmail = GetString(reader, "PacienteEmail"),
                        IdPlan = GetInt(reader, "IdPlan"),
                        NutricionistaCodigo = GetString(reader, "NutricionistaCodigo"),
                        FechaInicio = GetDateTime(reader, "FechaInicio"),
                        FechaFin = GetDateTime(reader, "FechaFin"),
                        FechaAsignacion = GetDateTime(reader, "FechaAsignacion"),
                        Paciente = new
                        {
                            Email = GetString(reader, "PacienteEmail"),
                            Nombre = GetString(reader, "Nombre"),
                            Apellido1 = GetString(reader, "Apellido1"),
                            Apellido2 = GetString(reader, "Apellido2")
                        },
                        PlanAlimentacion = new
                        {
                            IdPlan = GetInt(reader, "IdPlan"),
                            NombrePlan = GetString(reader, "NombrePlan"),
                            CaloriasTotales = GetInt(reader, "CaloriasTotales")
                        }
                    });
                }

                return Ok(asignaciones);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudieron cargar las asignaciones de planes.",
                    detalle = ex.Message
                });
            }
            finally
            {
                if (shouldClose && connection.State == ConnectionState.Open)
                    await connection.CloseAsync();
            }
        }

        // GET: api/PlanPaciente/activo?pacienteEmail=maria@gmail.com&codigo=NUT-2026-01&fecha=2026-06-21
        [HttpGet("activo")]
        public async Task<IActionResult> GetPlanActivoPorPacienteYFecha(
            [FromQuery] string pacienteEmail,
            [FromQuery] string codigo,
            [FromQuery] DateTime? fecha)
        {
            if (string.IsNullOrWhiteSpace(pacienteEmail))
                return BadRequest(new { mensaje = "El email del paciente es requerido." });

            if (string.IsNullOrWhiteSpace(codigo))
                return BadRequest(new { mensaje = "El código del nutricionista es requerido." });

            var fechaFiltro = (fecha ?? DateTime.Today).Date;
            var connection = _context.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;

            try
            {
                if (shouldClose)
                    await connection.OpenAsync();

                await using var command = connection.CreateCommand();
                command.CommandText = @"
                    SELECT
                        pp.IdAsignacion,
                        pp.PacienteEmail,
                        pp.IdPlan,
                        pp.NutricionistaCodigo,
                        pp.FechaInicio,
                        pp.FechaFin,
                        pp.FechaAsignacion,
                        pa.NombrePlan,
                        pa.CaloriasTotales,
                        pd.IdPlanDetalle,
                        pd.TiempoComida,
                        pd.ProductoCodigo,
                        pd.Porciones,
                        pr.Descripcion,
                        pr.EnergiaKcal,
                        pr.TamanoPorcion,
                        pr.UnidadMedida
                    FROM PlanPaciente pp
                    INNER JOIN PlanAlimentacion pa ON pa.IdPlan = pp.IdPlan
                    LEFT JOIN PlanDetalle pd ON pd.IdPlan = pa.IdPlan
                    LEFT JOIN Producto pr ON pr.CodigoBarras = pd.ProductoCodigo
                    WHERE LOWER(pp.PacienteEmail) = LOWER(@pacienteEmail)
                      AND LOWER(pp.NutricionistaCodigo) = LOWER(@codigo)
                      AND pp.FechaInicio <= @fecha
                      AND pp.FechaFin >= @fecha
                    ORDER BY
                        pp.FechaAsignacion DESC,
                        CASE pd.TiempoComida
                            WHEN 'Desayuno' THEN 1
                            WHEN 'Merienda Mañana' THEN 2
                            WHEN 'Almuerzo' THEN 3
                            WHEN 'Merienda Tarde' THEN 4
                            WHEN 'Cena' THEN 5
                            ELSE 99
                        END,
                        pd.IdPlanDetalle;";

                AddParameter(command, "@pacienteEmail", pacienteEmail.Trim());
                AddParameter(command, "@codigo", codigo.Trim());
                AddParameter(command, "@fecha", fechaFiltro);

                var planes = new Dictionary<int, PlanAsignadoDto>();
                await using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    var idAsignacion = GetInt(reader, "IdAsignacion");

                    if (!planes.TryGetValue(idAsignacion, out var plan))
                    {
                        plan = new PlanAsignadoDto
                        {
                            IdAsignacion = idAsignacion,
                            PacienteEmail = GetString(reader, "PacienteEmail"),
                            NutricionistaCodigo = GetString(reader, "NutricionistaCodigo"),
                            IdPlan = GetInt(reader, "IdPlan"),
                            NombrePlan = GetString(reader, "NombrePlan"),
                            CaloriasTotales = GetInt(reader, "CaloriasTotales"),
                            FechaInicio = GetDateTime(reader, "FechaInicio"),
                            FechaFin = GetDateTime(reader, "FechaFin"),
                            FechaAsignacion = GetDateTime(reader, "FechaAsignacion"),
                            DetallesPorTiempo = new List<PlanAsignadoTiempoDto>()
                        };

                        planes.Add(idAsignacion, plan);
                    }

                    if (IsNull(reader, "IdPlanDetalle"))
                        continue;

                    var tiempo = GetString(reader, "TiempoComida");
                    var grupo = plan.DetallesPorTiempo.FirstOrDefault(g => g.TiempoComida == tiempo);

                    if (grupo == null)
                    {
                        grupo = new PlanAsignadoTiempoDto
                        {
                            TiempoComida = tiempo,
                            TotalCalorias = 0,
                            Items = new List<PlanAsignadoItemDto>()
                        };
                        plan.DetallesPorTiempo.Add(grupo);
                    }

                    var porciones = GetInt(reader, "Porciones");
                    var energiaKcal = GetInt(reader, "EnergiaKcal");
                    var calorias = porciones * energiaKcal;

                    grupo.Items.Add(new PlanAsignadoItemDto
                    {
                        IdPlanDetalle = GetInt(reader, "IdPlanDetalle"),
                        ProductoCodigo = GetString(reader, "ProductoCodigo"),
                        Nombre = GetString(reader, "Descripcion"),
                        Porciones = porciones,
                        Calorias = calorias,
                        EnergiaKcal = energiaKcal,
                        TamanoPorcion = GetDecimal(reader, "TamanoPorcion"),
                        UnidadMedida = GetString(reader, "UnidadMedida")
                    });

                    grupo.TotalCalorias += calorias;
                }

                foreach (var plan in planes.Values)
                {
                    plan.DetallesPorTiempo = plan.DetallesPorTiempo
                        .OrderBy(g => OrdenTiempoComida(g.TiempoComida))
                        .ToList();
                }

                return Ok(planes.Values.ToList());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudieron cargar los planes asignados para esta fecha.",
                    detalle = ex.Message
                });
            }
            finally
            {
                if (shouldClose && connection.State == ConnectionState.Open)
                    await connection.CloseAsync();
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PlanPacienteCreateDto dto)
        {
            if (dto == null)
                return BadRequest(new { mensaje = "Debe enviar los datos de la asignación." });

            if (string.IsNullOrWhiteSpace(dto.PacienteEmail))
                return BadRequest(new { mensaje = "El email del paciente es requerido." });

            if (string.IsNullOrWhiteSpace(dto.NutricionistaCodigo))
                return BadRequest(new { mensaje = "El código del nutricionista es requerido." });

            if (dto.FechaFin < dto.FechaInicio)
                return BadRequest(new { mensaje = "La fecha fin no puede ser menor que la fecha inicio." });

            var connection = _context.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;

            try
            {
                if (shouldClose)
                    await connection.OpenAsync();

                if (!await ExisteAsync(connection, "SELECT COUNT(1) FROM Paciente WHERE Email = @email", "@email", dto.PacienteEmail.Trim()))
                    return BadRequest(new { mensaje = "El paciente no existe." });

                await using (var validarPlan = connection.CreateCommand())
                {
                    validarPlan.CommandText = @"
                        SELECT COUNT(1)
                        FROM PlanAlimentacion
                        WHERE IdPlan = @idPlan
                          AND LOWER(NutricionistaCodigo) = LOWER(@codigo);";
                    AddParameter(validarPlan, "@idPlan", dto.IdPlan);
                    AddParameter(validarPlan, "@codigo", dto.NutricionistaCodigo.Trim());

                    var existePlan = Convert.ToInt32(await validarPlan.ExecuteScalarAsync() ?? 0) > 0;
                    if (!existePlan)
                        return BadRequest(new { mensaje = "El plan no existe o no pertenece al nutricionista." });
                }

                await using var command = connection.CreateCommand();
                command.CommandText = @"
                    INSERT INTO PlanPaciente
                        (PacienteEmail, IdPlan, NutricionistaCodigo, FechaInicio, FechaFin, FechaAsignacion)
                    VALUES
                        (@pacienteEmail, @idPlan, @codigo, @fechaInicio, @fechaFin, GETDATE());

                    SELECT CAST(SCOPE_IDENTITY() AS INT);";

                AddParameter(command, "@pacienteEmail", dto.PacienteEmail.Trim());
                AddParameter(command, "@idPlan", dto.IdPlan);
                AddParameter(command, "@codigo", dto.NutricionistaCodigo.Trim());
                AddParameter(command, "@fechaInicio", dto.FechaInicio.Date);
                AddParameter(command, "@fechaFin", dto.FechaFin.Date);

                var idAsignacion = Convert.ToInt32(await command.ExecuteScalarAsync() ?? 0);

                return Ok(new
                {
                    mensaje = "Plan asignado correctamente.",
                    idAsignacion
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudo asignar el plan al paciente.",
                    detalle = ex.Message
                });
            }
            finally
            {
                if (shouldClose && connection.State == ConnectionState.Open)
                    await connection.CloseAsync();
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var connection = _context.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;

            try
            {
                if (shouldClose)
                    await connection.OpenAsync();

                await using var command = connection.CreateCommand();
                command.CommandText = "DELETE FROM PlanPaciente WHERE IdAsignacion = @id";
                AddParameter(command, "@id", id);

                var filas = await command.ExecuteNonQueryAsync();

                if (filas == 0)
                    return NotFound(new { mensaje = "Asignación no encontrada." });

                return Ok(new { mensaje = "Asignación eliminada correctamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudo eliminar la asignación.",
                    detalle = ex.Message
                });
            }
            finally
            {
                if (shouldClose && connection.State == ConnectionState.Open)
                    await connection.CloseAsync();
            }
        }

        private static async Task<bool> ExisteAsync(DbConnection connection, string sql, string parameterName, object value)
        {
            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            AddParameter(command, parameterName, value);
            return Convert.ToInt32(await command.ExecuteScalarAsync() ?? 0) > 0;
        }

        private static void AddParameter(DbCommand command, string name, object? value)
        {
            var parameter = command.CreateParameter();
            parameter.ParameterName = name;
            parameter.Value = value ?? DBNull.Value;
            command.Parameters.Add(parameter);
        }

        private static bool IsNull(DbDataReader reader, string columnName)
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal);
        }

        private static string GetString(DbDataReader reader, string columnName)
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? string.Empty : Convert.ToString(reader.GetValue(ordinal)) ?? string.Empty;
        }

        private static int GetInt(DbDataReader reader, string columnName)
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? 0 : Convert.ToInt32(reader.GetValue(ordinal));
        }

        private static decimal GetDecimal(DbDataReader reader, string columnName)
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? 0 : Convert.ToDecimal(reader.GetValue(ordinal));
        }

        private static DateTime GetDateTime(DbDataReader reader, string columnName)
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? DateTime.MinValue : Convert.ToDateTime(reader.GetValue(ordinal));
        }

        private static int OrdenTiempoComida(string tiempoComida)
        {
            return tiempoComida switch
            {
                "Desayuno" => 1,
                "Merienda Mañana" => 2,
                "Almuerzo" => 3,
                "Merienda Tarde" => 4,
                "Cena" => 5,
                _ => 99
            };
        }

        private class PlanAsignadoDto
        {
            public int IdAsignacion { get; set; }
            public string PacienteEmail { get; set; } = string.Empty;
            public string NutricionistaCodigo { get; set; } = string.Empty;
            public int IdPlan { get; set; }
            public string NombrePlan { get; set; } = string.Empty;
            public int CaloriasTotales { get; set; }
            public DateTime FechaInicio { get; set; }
            public DateTime FechaFin { get; set; }
            public DateTime FechaAsignacion { get; set; }
            public List<PlanAsignadoTiempoDto> DetallesPorTiempo { get; set; } = new();
        }

        private class PlanAsignadoTiempoDto
        {
            public string TiempoComida { get; set; } = string.Empty;
            public int TotalCalorias { get; set; }
            public List<PlanAsignadoItemDto> Items { get; set; } = new();
        }

        private class PlanAsignadoItemDto
        {
            public int IdPlanDetalle { get; set; }
            public string ProductoCodigo { get; set; } = string.Empty;
            public string Nombre { get; set; } = string.Empty;
            public int Porciones { get; set; }
            public int Calorias { get; set; }
            public int EnergiaKcal { get; set; }
            public decimal TamanoPorcion { get; set; }
            public string UnidadMedida { get; set; } = string.Empty;
        }
    }
}