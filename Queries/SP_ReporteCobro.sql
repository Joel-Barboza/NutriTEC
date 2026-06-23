CREATE OR ALTER PROCEDURE SP_ReporteCobro
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        n.TipoCobro,
        n.Email,
        n.Nombre + ' ' + n.Apellido1 + ISNULL(' ' + n.Apellido2, '') AS NombreCompleto,
        n.NumeroTarjeta,
        COUNT(pn.PacienteEmail) AS TotalPacientes,
        CAST(CASE n.TipoCobro
            WHEN 'Semanal' THEN COUNT(pn.PacienteEmail) * 1.00
            WHEN 'Mensual' THEN COUNT(pn.PacienteEmail) * 4.00
            WHEN 'Anual'   THEN COUNT(pn.PacienteEmail) * 52.00
            ELSE 0.00
        END AS DECIMAL(10,2)) AS MontoTotal,
        CAST(CASE n.TipoCobro
            WHEN 'Semanal' THEN 0.00
            WHEN 'Mensual' THEN COUNT(pn.PacienteEmail) * 4.00 * 0.05
            WHEN 'Anual'   THEN COUNT(pn.PacienteEmail) * 52.00 * 0.10
            ELSE 0.00
        END AS DECIMAL(10,2)) AS Descuento,
        CAST(CASE n.TipoCobro
            WHEN 'Semanal' THEN COUNT(pn.PacienteEmail) * 1.00
            WHEN 'Mensual' THEN COUNT(pn.PacienteEmail) * 4.00 * 0.95
            WHEN 'Anual'   THEN COUNT(pn.PacienteEmail) * 52.00 * 0.90
            ELSE 0.00
        END AS DECIMAL(10,2)) AS MontoACobrar
    FROM Nutricionista n
    LEFT JOIN PacienteNutricionista pn
        ON pn.NutricionistaCodigo = n.CodigoNutricionista
    GROUP BY
        n.TipoCobro,
        n.Email,
        n.Nombre,
        n.Apellido1,
        n.Apellido2,
        n.NumeroTarjeta
    ORDER BY
        CASE n.TipoCobro
            WHEN 'Semanal' THEN 1
            WHEN 'Mensual' THEN 2
            WHEN 'Anual' THEN 3
            ELSE 4
        END,
        NombreCompleto;
END;
GO
