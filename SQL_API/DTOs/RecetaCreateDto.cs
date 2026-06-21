namespace SQL_API.DTOs
{
    public class RecetaCreateDto
    {
        public string NombreReceta { get; set; } = null!;
        public string CreadoPorEmail { get; set; } = null!;
        public List<RecetaDetalleDto> Ingredientes { get; set; } = new();
    }

    public class RecetaDetalleDto
    {
        public string ProductoCodigo { get; set; } = null!;
        public decimal CantidadPorciones { get; set; }
    }
}
