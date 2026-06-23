using MongoAPI.Configurations;
using MongoAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// ── Configuración MongoDB ──────────────────────────────────────────────────
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

builder.Services.AddSingleton<NutritecMongoDbContext>();

// ── CORS ───────────────────────────────────────────────────────────────────
// Exponer cabeceras personalizadas (X-NutriTEC-*) para que el frontend las lea
builder.Services.AddCors(options =>
{
    options.AddPolicy("NutriTecCors", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader()
            .WithExposedHeaders(
                "X-NutriTEC-Mongo-Database",
                "X-NutriTEC-Mongo-Collection",
                "X-NutriTEC-Mongo-InsertedId",
                "X-NutriTEC-Mongo-UpdatedId"
            );
    });
});

// ── Controladores ──────────────────────────────────────────────────────────
// PropertyNamingPolicy = CamelCase hace que las respuestas salgan en camelCase
// y que el model binding acepte JSON en camelCase desde Angular
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("NutriTecCors");
app.UseAuthorization();
app.MapControllers();

app.Run();
