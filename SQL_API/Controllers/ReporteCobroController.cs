using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
using SQL_API.Models;
using System.Data;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/reporte-cobro")]
    public class ReporteCobroController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public ReporteCobroController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/reporte-cobro
        // Ejecuta el Stored Procedure SP_ReporteCobro y retorna el reporte al admin.
        [HttpGet]
        public async Task<IActionResult> GetReporteCobro()
        {
            var reporte = new List<ReporteCobroDto>();

            var connection = _context.Database.GetDbConnection();
            using var command = connection.CreateCommand();
            command.CommandText = "SP_ReporteCobro";
            command.CommandType = CommandType.StoredProcedure;

            var debeCerrarConexion = connection.State != ConnectionState.Open;
            if (debeCerrarConexion)
            {
                await connection.OpenAsync();
            }

            try
            {
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    reporte.Add(new ReporteCobroDto
                    {
                        TipoCobro = reader["TipoCobro"]?.ToString() ?? string.Empty,
                        Email = reader["Email"]?.ToString() ?? string.Empty,
                        NombreCompleto = reader["NombreCompleto"]?.ToString() ?? string.Empty,
                        NumeroTarjeta = reader["NumeroTarjeta"]?.ToString() ?? string.Empty,
                        TotalPacientes = Convert.ToInt32(reader["TotalPacientes"]),
                        MontoTotal = Convert.ToDecimal(reader["MontoTotal"]),
                        Descuento = Convert.ToDecimal(reader["Descuento"]),
                        MontoACobrar = Convert.ToDecimal(reader["MontoACobrar"])
                    });
                }
            }
            finally
            {
                if (debeCerrarConexion)
                {
                    await connection.CloseAsync();
                }
            }

            return Ok(reporte);
        }
    }
}
