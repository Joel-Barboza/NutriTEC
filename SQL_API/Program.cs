using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
using SQL_API.Models;
using System.Data;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("NutritecConnection");

builder.Services.AddDbContext<NutritecDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowAngular");

app.UseAuthorization();

app.MapControllers();

// -----------------------------------------------------------------------------
// Endpoints de diagnóstico para verificar que la API correcta está corriendo.
// No toca la base de datos.
// Prueba: http://localhost:5274/api/reporte-cobro-ping
// -----------------------------------------------------------------------------
app.MapGet("/api/reporte-cobro-ping", () => Results.Ok(new
{
    ok = true,
    mensaje = "SQL_API activa. Esta es la API correcta para Reporte de Cobro.",
    fecha = DateTime.Now
}));

// -----------------------------------------------------------------------------
// Diagnóstico de conexión a SQL.
// Prueba: http://localhost:5274/api/reporte-cobro-db-test
// -----------------------------------------------------------------------------
app.MapGet("/api/reporte-cobro-db-test", async (NutritecDbContext context) =>
{
    using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));

    try
    {
        var connection = context.Database.GetDbConnection();
        var debeCerrarConexion = connection.State != ConnectionState.Open;

        if (debeCerrarConexion)
        {
            await connection.OpenAsync(timeout.Token);
        }

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT
                    DB_NAME() AS BaseDatos,
                    @@SERVERNAME AS Servidor,
                    (SELECT COUNT(*) FROM Nutricionista) AS TotalNutricionistas,
                    (SELECT COUNT(*) FROM PacienteNutricionista) AS TotalAsociaciones,
                    CASE WHEN OBJECT_ID('SP_ReporteCobro', 'P') IS NULL THEN 0 ELSE 1 END AS ExisteSP;";
            command.CommandType = CommandType.Text;
            command.CommandTimeout = 15;

            using var reader = await command.ExecuteReaderAsync(timeout.Token);
            if (!await reader.ReadAsync(timeout.Token))
            {
                return Results.Json(new
                {
                    ok = false,
                    mensaje = "La consulta de diagnóstico no devolvió datos."
                }, statusCode: 500);
            }

            return Results.Ok(new
            {
                ok = true,
                baseDatos = reader["BaseDatos"]?.ToString(),
                servidor = reader["Servidor"]?.ToString(),
                totalNutricionistas = Convert.ToInt32(reader["TotalNutricionistas"]),
                totalAsociaciones = Convert.ToInt32(reader["TotalAsociaciones"]),
                existeSP = Convert.ToInt32(reader["ExisteSP"]) == 1
            });
        }
        finally
        {
            if (debeCerrarConexion)
            {
                await connection.CloseAsync();
            }
        }
    }
    catch (OperationCanceledException)
    {
        return Results.Json(new
        {
            ok = false,
            mensaje = "La conexión o consulta a SQL tardó más de 15 segundos. Revise la cadena de conexión, firewall de Azure SQL o que la base esté disponible."
        }, statusCode: 504);
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            ok = false,
            mensaje = "No se pudo conectar o consultar la base de datos.",
            detalle = ex.Message
        }, statusCode: 500);
    }
});

// -----------------------------------------------------------------------------
// Endpoint directo para Reporte de Cobro.
// Angular llama esta ruta: /api/reporte-cobro-sp
// Usa SP_ReporteCobro, como pide el enunciado.
// -----------------------------------------------------------------------------
app.MapGet("/api/reporte-cobro-sp", async (NutritecDbContext context) =>
{
    using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));

    try
    {
        var reporte = new List<ReporteCobroDto>();
        var connection = context.Database.GetDbConnection();
        var debeCerrarConexion = connection.State != ConnectionState.Open;

        if (debeCerrarConexion)
        {
            await connection.OpenAsync(timeout.Token);
        }

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "SP_ReporteCobro";
            command.CommandType = CommandType.StoredProcedure;
            command.CommandTimeout = 20;

            using var reader = await command.ExecuteReaderAsync(timeout.Token);
            while (await reader.ReadAsync(timeout.Token))
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

        return Results.Ok(reporte);
    }
    catch (OperationCanceledException)
    {
        return Results.Json(new
        {
            mensaje = "El reporte de cobro tardó más de 20 segundos. Revise SQL Server/Azure SQL o ejecute SP_ReporteCobro directamente en la base de datos."
        }, statusCode: 504);
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            mensaje = "No se pudo generar el reporte de cobro desde la API.",
            detalle = ex.Message
        }, statusCode: 500);
    }
});

app.Run();
