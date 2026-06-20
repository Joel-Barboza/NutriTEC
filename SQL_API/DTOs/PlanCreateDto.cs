namespace SQL_API.DTOs
{
    public class PlanCreateDto
    {
        public string NombrePlan { get; set; } = string.Empty;
        public string NutricionistaCodigo { get; set; } = string.Empty;
        public List<PlanDetalleCreateDto> Detalles { get; set; } = new();
    }

    public class PlanDetalleCreateDto
    {
        public string TiempoComida { get; set; } = string.Empty;
        public string ProductoCodigo { get; set; } = string.Empty;
        public decimal Porciones { get; set; }
    }
}