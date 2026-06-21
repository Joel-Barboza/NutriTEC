namespace SQL_API.DTOs
{
    public class PacienteBusquedaDto
    {
        public string Email { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string Apellido1 { get; set; } = null!;
        public string Apellido2 { get; set; } = null!;
        public string NombreCompleto { get; set; } = null!;
        public string PaisResidencia { get; set; } = null!;
        public decimal PesoActual { get; set; }
        public decimal IMC { get; set; }
        public int ConsumoMaxCalorias { get; set; }
        public bool AsociadoAlNutricionista { get; set; }
        public string? NutricionistaActualCodigo { get; set; }
        public DateTime? FechaAsociacion { get; set; }
    }

    public class PacienteAsociadoDto
    {
        public string PacienteEmail { get; set; } = null!;
        public string NutricionistaCodigo { get; set; } = null!;
        public DateTime FechaAsociacion { get; set; }
        public string Nombre { get; set; } = null!;
        public string Apellido1 { get; set; } = null!;
        public string Apellido2 { get; set; } = null!;
        public string NombreCompleto { get; set; } = null!;
        public string PaisResidencia { get; set; } = null!;
        public decimal PesoActual { get; set; }
        public decimal IMC { get; set; }
        public int ConsumoMaxCalorias { get; set; }
    }

    public class AsociarPacienteRequest
    {
        public string CodigoNutricionista { get; set; } = null!;
        public string PacienteEmail { get; set; } = null!;
    }

    public class AsociacionPacienteResponseDto
    {
        public string Mensaje { get; set; } = null!;
        public string PacienteEmail { get; set; } = null!;
        public string NutricionistaCodigo { get; set; } = null!;
        public DateTime FechaAsociacion { get; set; }
    }
}
