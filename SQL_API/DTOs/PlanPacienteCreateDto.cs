namespace SQL_API.DTOs
{
    public class PlanPacienteCreateDto
    {
        public string PacienteEmail { get; set; } = string.Empty;
        public int IdPlan { get; set; }
        public string NutricionistaCodigo { get; set; } = string.Empty;
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
    }
}
