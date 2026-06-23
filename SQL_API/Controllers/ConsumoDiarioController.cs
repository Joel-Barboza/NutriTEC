using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.Models;
using System.Data;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConsumoDiarioController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public ConsumoDiarioController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/consumodiario?pacienteEmail=X&fecha=YYYY-MM-DD
        [HttpGet]
        public async Task<IActionResult> GetByPacienteYFecha(
            [FromQuery] string pacienteEmail,
            [FromQuery] DateTime? fecha)
        {
            if (string.IsNullOrWhiteSpace(pacienteEmail))
                return BadRequest(new { mensaje = "El email del paciente es requerido." });

            var fechaFiltro = (fecha ?? DateTime.Today).Date;

            var consumos = await _context.ConsumosDiarios
                .Include(c => c.Producto)
                .Include(c => c.Receta)
                .Where(c =>
                    c.PacienteEmail.ToLower() == pacienteEmail.Trim().ToLower() &&
                    c.Fecha.Date == fechaFiltro)
                .OrderBy(c => c.TiempoComida)
                .ToListAsync();

            return Ok(consumos);
        }

        // GET: api/consumodiario/resumen?pacienteEmail=X&fecha=YYYY-MM-DD
        // Endpoint usado por la vista de Seguimiento Paciente.
        [HttpGet("resumen")]
        public async Task<IActionResult> GetResumen(
            [FromQuery] string pacienteEmail,
            [FromQuery] DateTime? fecha)
        {
            if (string.IsNullOrWhiteSpace(pacienteEmail))
                return BadRequest(new { mensaje = "El email del paciente es requerido." });

            var fechaFiltro = (fecha ?? DateTime.Today).Date;
            var filas = new List<ConsumoResumenFila>();

            try
            {
                var conexion = _context.Database.GetDbConnection();
                await using var comando = conexion.CreateCommand();

                comando.CommandText = @"
                    SELECT
                        cd.IdConsumo,
                        cd.TiempoComida,
                        ISNULL(p.Descripcion, r.NombreReceta) AS Nombre,
                        cd.Cantidad,
                        CAST(ISNULL(p.EnergiaKcal, r.CaloriasTotales) * cd.Cantidad AS DECIMAL(18,2)) AS Calorias
                    FROM ConsumoDiario cd
                    LEFT JOIN Producto p ON p.CodigoBarras = cd.ProductoCodigo
                    LEFT JOIN Receta r ON r.IdReceta = cd.IdReceta
                    WHERE LOWER(cd.PacienteEmail) = LOWER(@PacienteEmail)
                      AND CAST(cd.Fecha AS DATE) = @Fecha
                    ORDER BY
                        CASE cd.TiempoComida
                            WHEN 'Desayuno' THEN 1
                            WHEN 'Merienda Mañana' THEN 2
                            WHEN 'Almuerzo' THEN 3
                            WHEN 'Merienda Tarde' THEN 4
                            WHEN 'Cena' THEN 5
                            ELSE 6
                        END,
                        cd.IdConsumo;";

                var parametroEmail = comando.CreateParameter();
                parametroEmail.ParameterName = "@PacienteEmail";
                parametroEmail.Value = pacienteEmail.Trim();
                comando.Parameters.Add(parametroEmail);

                var parametroFecha = comando.CreateParameter();
                parametroFecha.ParameterName = "@Fecha";
                parametroFecha.Value = fechaFiltro;
                comando.Parameters.Add(parametroFecha);

                if (conexion.State != ConnectionState.Open)
                    await conexion.OpenAsync();

                await using var reader = await comando.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    filas.Add(new ConsumoResumenFila
                    {
                        IdConsumo = reader.GetInt32(reader.GetOrdinal("IdConsumo")),
                        TiempoComida = reader.GetString(reader.GetOrdinal("TiempoComida")),
                        Nombre = reader.IsDBNull(reader.GetOrdinal("Nombre"))
                            ? "Desconocido"
                            : reader.GetString(reader.GetOrdinal("Nombre")),
                        Cantidad = reader.GetDecimal(reader.GetOrdinal("Cantidad")),
                        Calorias = reader.IsDBNull(reader.GetOrdinal("Calorias"))
                            ? 0
                            : reader.GetDecimal(reader.GetOrdinal("Calorias"))
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudo cargar el resumen de consumo diario.",
                    detalle = ex.Message
                });
            }

            var resumen = filas
                .GroupBy(f => f.TiempoComida)
                .Select(g => new
                {
                    tiempoComida = g.Key,
                    items = g.Select(f => new
                    {
                        idConsumo = f.IdConsumo,
                        nombre = f.Nombre,
                        cantidad = f.Cantidad,
                        calorias = decimal.ToInt32(Math.Round(f.Calorias, 0))
                    }).ToList(),
                    totalCalorias = decimal.ToInt32(Math.Round(g.Sum(f => f.Calorias), 0))
                })
                .ToList();

            return Ok(resumen);
        }

        // POST: api/consumodiario
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ConsumoDiario consumo)
        {
            if (consumo.ProductoCodigo == null && consumo.IdReceta == null)
                return BadRequest(new { mensaje = "Debe especificar un producto o una receta." });

            if (consumo.ProductoCodigo != null && consumo.IdReceta != null)
                return BadRequest(new { mensaje = "Solo puede especificar un producto o una receta, no ambos." });

            var pacienteExiste = await _context.Pacientes
                .AnyAsync(p => p.Email.ToLower() == consumo.PacienteEmail.ToLower());

            if (!pacienteExiste)
                return NotFound(new { mensaje = "Paciente no encontrado." });

            if (consumo.ProductoCodigo != null)
            {
                var productoExiste = await _context.Productos
                    .AnyAsync(p => p.CodigoBarras == consumo.ProductoCodigo && p.AprobadoPorAdministrador);
                if (!productoExiste)
                    return NotFound(new { mensaje = "Producto no encontrado o no aprobado." });
            }

            if (consumo.IdReceta != null)
            {
                var recetaExiste = await _context.Recetas
                    .AnyAsync(r => r.IdReceta == consumo.IdReceta && r.CreadoPorEmail.ToLower() == consumo.PacienteEmail.ToLower());
                if (!recetaExiste)
                    return NotFound(new { mensaje = "Receta no encontrada." });
            }

            consumo.Fecha = consumo.Fecha == default ? DateTime.Today : consumo.Fecha.Date;

            _context.ConsumosDiarios.Add(consumo);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Consumo registrado con exito.", idConsumo = consumo.IdConsumo });
        }

        // DELETE: api/consumodiario/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var consumo = await _context.ConsumosDiarios.FindAsync(id);

            if (consumo == null)
                return NotFound(new { mensaje = "Registro de consumo no encontrado." });

            _context.ConsumosDiarios.Remove(consumo);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Consumo eliminado." });
        }

        private class ConsumoResumenFila
        {
            public int IdConsumo { get; set; }
            public string TiempoComida { get; set; } = string.Empty;
            public string Nombre { get; set; } = string.Empty;
            public decimal Cantidad { get; set; }
            public decimal Calorias { get; set; }
        }
    }
}
