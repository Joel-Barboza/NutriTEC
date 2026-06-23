namespace SQL_API.DTOs
{
    public class ReporteCobroDto
    {
        public string TipoCobro { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public string NumeroTarjeta { get; set; } = string.Empty;
        public int TotalPacientes { get; set; }
        public decimal MontoTotal { get; set; }
        public decimal Descuento { get; set; }
        public decimal MontoACobrar { get; set; }
    }
}
