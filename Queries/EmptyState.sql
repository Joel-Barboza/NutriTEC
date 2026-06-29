-- ============================================================================
-- SCRIPT DE CREACIÓN DE ESTRUCTURA (EMPTY STATE) - NUTRI TEC
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ELIMINACIÓN DE TABLAS (En orden inverso para evitar conflictos FK)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS ConsumoDiario;
DROP TABLE IF EXISTS RecetaDetalle;
DROP TABLE IF EXISTS Receta;
DROP TABLE IF EXISTS PlanDetalle;
DROP TABLE IF EXISTS PlanAlimentacion;
DROP TABLE IF EXISTS PacienteNutricionista;
DROP TABLE IF EXISTS Producto;
DROP TABLE IF EXISTS RegistroMedidas;
DROP TABLE IF EXISTS Paciente;
DROP TABLE IF EXISTS Nutricionista;
DROP TABLE IF EXISTS Administrador;
GO

-- ----------------------------------------------------------------------------
-- CREACIÓN DE TABLAS BASE
-- ----------------------------------------------------------------------------

CREATE TABLE Administrador (
    Email VARCHAR(150) NOT NULL,
    PasswordEncriptado VARCHAR(255) NOT NULL,
    PRIMARY KEY (Email)
);

CREATE TABLE Nutricionista (
    CodigoNutricionista VARCHAR(20) NOT NULL,
    Cedula              VARCHAR(20)  NOT NULL,
    Nombre              VARCHAR(50)  NOT NULL,
    Apellido1           VARCHAR(50)  NOT NULL,
    Apellido2           VARCHAR(50),
    FechaNacimiento     DATE         NOT NULL,
    Peso                DECIMAL(5,2) NOT NULL,
    IMC                 DECIMAL(4,2) NOT NULL,
    Direccion           VARCHAR(255) NOT NULL,
    Foto                VARCHAR(MAX) NULL,
    NumeroTarjeta       VARCHAR(20)  NOT NULL,
    TipoCobro           VARCHAR(15)  NOT NULL,
    Email               VARCHAR(150) NOT NULL,
    PasswordEncriptado  VARCHAR(255) NOT NULL,
    PRIMARY KEY (CodigoNutricionista)
);

CREATE TABLE Paciente (
    Email                 VARCHAR(150) NOT NULL,
    Nombre                VARCHAR(50)  NOT NULL,
    Apellido1             VARCHAR(50)  NOT NULL,
    Apellido2             VARCHAR(50)  NOT NULL,
    FechaNacimiento       DATE         NOT NULL,
    PaisResidencia        VARCHAR(50)  NOT NULL,
    PesoInicial           DECIMAL(5,2) NOT NULL,
    PesoActual            DECIMAL(5,2) NOT NULL,
    IMC                   DECIMAL(4,2) NOT NULL,
    Cintura               DECIMAL(5,2) NOT NULL,
    Cuello                DECIMAL(5,2) NOT NULL,
    Caderas               DECIMAL(5,2) NOT NULL,
    PorcentajeMusculo     DECIMAL(4,2) NOT NULL,
    PorcentajeGrasa       DECIMAL(4,2) NOT NULL,
    ConsumoMaxCalorias    INT          NOT NULL,
    PasswordEncriptado    VARCHAR(255) NOT NULL,
    PRIMARY KEY (Email)
);

CREATE TABLE RegistroMedidas (
    IdRegistro        INT IDENTITY(1,1) NOT NULL,
    PacienteEmail     VARCHAR(150)      NOT NULL,
    Fecha             DATE              NOT NULL,
    Cintura           DECIMAL(5,2)      NOT NULL,
    Cuello            DECIMAL(5,2)      NOT NULL,
    Caderas           DECIMAL(5,2)      NOT NULL,
    PorcentajeMusculo DECIMAL(4,2)      NOT NULL,
    PorcentajeGrasa   DECIMAL(4,2)      NOT NULL,
    PRIMARY KEY (IdRegistro)
);

CREATE TABLE Producto (
    CodigoBarras              VARCHAR(50)  NOT NULL,
    Descripcion               VARCHAR(150) NOT NULL,
    TamanoPorcion             DECIMAL(6,2) NOT NULL,
    UnidadMedida              VARCHAR(10)  NOT NULL,
    EnergiaKcal               INT          NOT NULL,
    GrasaG                    DECIMAL(5,2) NOT NULL,
    SodioMg                   DECIMAL(6,2) NOT NULL,
    CarbohidratosG            DECIMAL(5,2) NOT NULL,
    ProteinaG                 DECIMAL(5,2) NOT NULL,
    Vitaminas                 VARCHAR(255) NULL,
    CalcioMg                  DECIMAL(6,2) NOT NULL,
    HierroMg                  DECIMAL(6,2) NOT NULL,
    AprobadoPorAdministrador  BIT          NOT NULL DEFAULT 0,
    CreadoPor                 VARCHAR(150) NOT NULL,
    PRIMARY KEY (CodigoBarras)
);

CREATE TABLE PacienteNutricionista (
    PacienteEmail       VARCHAR(150) NOT NULL,
    NutricionistaCodigo VARCHAR(20)  NOT NULL,
    FechaAsociacion     DATE         NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (PacienteEmail)
);

CREATE TABLE PlanAlimentacion (
    IdPlan              INT IDENTITY(1,1) NOT NULL,
    NombrePlan          VARCHAR(100)      NOT NULL,
    NutricionistaCodigo VARCHAR(20)       NOT NULL,
    CaloriasTotales     INT               NOT NULL DEFAULT 0,
    PRIMARY KEY (IdPlan)
);

CREATE TABLE PlanDetalle (
    IdPlanDetalle  INT IDENTITY(1,1) NOT NULL,
    IdPlan         INT               NOT NULL,
    TiempoComida   VARCHAR(20)       NOT NULL,
    ProductoCodigo VARCHAR(50)       NOT NULL,
    Porciones      INT               NOT NULL DEFAULT 1,
    PRIMARY KEY (IdPlanDetalle)
);

CREATE TABLE Receta (
    IdReceta             INT IDENTITY(1,1) NOT NULL,
    NombreReceta         VARCHAR(100)      NOT NULL,
    CreadoPorEmail       VARCHAR(150)      NOT NULL,
    CaloriasTotales      INT               NOT NULL DEFAULT 0,
    CarbohidratosTotales DECIMAL(5,2)      NOT NULL DEFAULT 0,
    ProteinasTotales     DECIMAL(5,2)      NOT NULL DEFAULT 0,
    GrasasTotales        DECIMAL(5,2)      NOT NULL DEFAULT 0,
    PRIMARY KEY (IdReceta)
);

CREATE TABLE RecetaDetalle (
    IdRecetaDetalle  INT IDENTITY(1,1) NOT NULL,
    IdReceta         INT               NOT NULL,
    ProductoCodigo   VARCHAR(50)       NOT NULL,
    CantidadPorciones DECIMAL(4,2)     NOT NULL,
    PRIMARY KEY (IdRecetaDetalle)
);

CREATE TABLE ConsumoDiario (
    IdConsumo     INT IDENTITY(1,1) NOT NULL,
    PacienteEmail VARCHAR(150)      NOT NULL,
    Fecha         DATE              NOT NULL DEFAULT GETDATE(),
    TiempoComida  VARCHAR(20)       NOT NULL,
    ProductoCodigo VARCHAR(50)      NULL,
    IdReceta      INT               NULL,
    Cantidad      DECIMAL(4,2)      NOT NULL DEFAULT 1,
    PRIMARY KEY (IdConsumo)
);
GO

-- ----------------------------------------------------------------------------
-- RESTRICCIONES (ALTER TABLE)
-- ----------------------------------------------------------------------------

ALTER TABLE Nutricionista
ADD CONSTRAINT UQ_Nutricionista_Email UNIQUE (Email);

ALTER TABLE Nutricionista
ADD CONSTRAINT CK_Nutricionista_TipoCobro CHECK (TipoCobro IN ('Semanal', 'Mensual', 'Anual'));

ALTER TABLE RegistroMedidas
ADD CONSTRAINT FK_Medidas_Paciente
FOREIGN KEY (PacienteEmail) REFERENCES Paciente(Email) ON DELETE CASCADE;

ALTER TABLE RegistroMedidas
ADD CONSTRAINT UQ_Paciente_Fecha_Medida UNIQUE (PacienteEmail, Fecha);

ALTER TABLE Producto
ADD CONSTRAINT CK_Producto_UnidadMedida CHECK (UnidadMedida IN ('g', 'ml'));

ALTER TABLE PacienteNutricionista
ADD CONSTRAINT FK_Asoc_Paciente
FOREIGN KEY (PacienteEmail) REFERENCES Paciente(Email);

ALTER TABLE PacienteNutricionista
ADD CONSTRAINT FK_Asoc_Nutricionista
FOREIGN KEY (NutricionistaCodigo) REFERENCES Nutricionista(CodigoNutricionista);

ALTER TABLE PlanAlimentacion
ADD CONSTRAINT FK_Plan_Nutricionista
FOREIGN KEY (NutricionistaCodigo) REFERENCES Nutricionista(CodigoNutricionista) ON DELETE CASCADE;

ALTER TABLE PlanDetalle
ADD CONSTRAINT FK_Detalle_Plan
FOREIGN KEY (IdPlan) REFERENCES PlanAlimentacion(IdPlan) ON DELETE CASCADE;

ALTER TABLE PlanDetalle
ADD CONSTRAINT FK_Detalle_Producto
FOREIGN KEY (ProductoCodigo) REFERENCES Producto(CodigoBarras);

ALTER TABLE PlanDetalle
ADD CONSTRAINT CK_Detalle_TiempoComida
CHECK (TiempoComida IN ('Desayuno', 'Merienda Mañana', 'Almuerzo', 'Merienda Tarde', 'Cena'));

ALTER TABLE RecetaDetalle
ADD CONSTRAINT FK_RecetaDetalle_Receta
FOREIGN KEY (IdReceta) REFERENCES Receta(IdReceta) ON DELETE CASCADE;

ALTER TABLE RecetaDetalle
ADD CONSTRAINT FK_RecetaDetalle_Producto
FOREIGN KEY (ProductoCodigo) REFERENCES Producto(CodigoBarras);

ALTER TABLE ConsumoDiario
ADD CONSTRAINT FK_Consumo_Paciente
FOREIGN KEY (PacienteEmail) REFERENCES Paciente(Email) ON DELETE CASCADE;

ALTER TABLE ConsumoDiario
ADD CONSTRAINT FK_Consumo_Producto
FOREIGN KEY (ProductoCodigo) REFERENCES Producto(CodigoBarras);

ALTER TABLE ConsumoDiario
ADD CONSTRAINT FK_Consumo_Receta
FOREIGN KEY (IdReceta) REFERENCES Receta(IdReceta);

ALTER TABLE ConsumoDiario
ADD CONSTRAINT CK_Consumo_TiempoComida
CHECK (TiempoComida IN ('Desayuno', 'Merienda Mañana', 'Almuerzo', 'Merienda Tarde', 'Cena'));

ALTER TABLE ConsumoDiario
ADD CONSTRAINT CK_Consumo_MutuamenteExcluyente
CHECK (
    (ProductoCodigo IS NOT NULL AND IdReceta IS NULL) OR
    (ProductoCodigo IS NULL AND IdReceta IS NOT NULL)
);
GO

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger 1: Al insertar un consumo diario, registrar automáticamente la fecha actual si no se provee
CREATE OR ALTER TRIGGER TR_ConsumoDiario_FechaDefault
ON ConsumoDiario
AFTER INSERT
AS
BEGIN
    UPDATE ConsumoDiario
    SET Fecha = CAST(GETDATE() AS DATE)
    FROM ConsumoDiario c
    INNER JOIN inserted i ON c.IdConsumo = i.IdConsumo
    WHERE i.Fecha IS NULL;
END;
GO

-- Trigger 2: Al aprobar un producto, actualizar las recetas que lo usan (recalcular totales)
CREATE OR ALTER TRIGGER TR_Producto_Aprobacion
ON Producto
AFTER UPDATE
AS
BEGIN
    IF UPDATE(AprobadoPorAdministrador)
    BEGIN
        UPDATE Receta
        SET CaloriasTotales = (
            SELECT ISNULL(SUM(p.EnergiaKcal * rd.CantidadPorciones), 0)
            FROM RecetaDetalle rd
            INNER JOIN Producto p ON p.CodigoBarras = rd.ProductoCodigo
            WHERE rd.IdReceta = Receta.IdReceta
        ),
        CarbohidratosTotales = (
            SELECT ISNULL(SUM(p.CarbohidratosG * rd.CantidadPorciones), 0)
            FROM RecetaDetalle rd
            INNER JOIN Producto p ON p.CodigoBarras = rd.ProductoCodigo
            WHERE rd.IdReceta = Receta.IdReceta
        ),
        ProteinasTotales = (
            SELECT ISNULL(SUM(p.ProteinaG * rd.CantidadPorciones), 0)
            FROM RecetaDetalle rd
            INNER JOIN Producto p ON p.CodigoBarras = rd.ProductoCodigo
            WHERE rd.IdReceta = Receta.IdReceta
        ),
        GrasasTotales = (
            SELECT ISNULL(SUM(p.GrasaG * rd.CantidadPorciones), 0)
            FROM RecetaDetalle rd
            INNER JOIN Producto p ON p.CodigoBarras = rd.ProductoCodigo
            WHERE rd.IdReceta = Receta.IdReceta
        )
        WHERE IdReceta IN (
            SELECT DISTINCT rd.IdReceta
            FROM RecetaDetalle rd
            INNER JOIN inserted i ON rd.ProductoCodigo = i.CodigoBarras
        );
    END
END;
GO

-- ----------------------------------------------------------------------------
-- VISTAS
-- ----------------------------------------------------------------------------

-- Vista 1: Productos aprobados con su información nutricional completa
CREATE OR ALTER VIEW VW_ProductosAprobados AS
SELECT
    CodigoBarras,
    Descripcion,
    TamanoPorcion,
    UnidadMedida,
    EnergiaKcal,
    GrasaG,
    SodioMg,
    CarbohidratosG,
    ProteinaG,
    Vitaminas,
    CalcioMg,
    HierroMg,
    CreadoPor
FROM Producto
WHERE AprobadoPorAdministrador = 1;
GO

-- Vista 2: Resumen de registro diario de consumo por paciente y fecha
CREATE OR ALTER VIEW VW_ConsumoDiarioResumen AS
SELECT
    cd.PacienteEmail,
    cd.Fecha,
    cd.TiempoComida,
    ISNULL(p.Descripcion, r.NombreReceta) AS Item,
    cd.Cantidad,
    ISNULL(p.EnergiaKcal, r.CaloriasTotales) * cd.Cantidad AS CaloriasConsumidas
FROM ConsumoDiario cd
LEFT JOIN Producto p ON p.CodigoBarras = cd.ProductoCodigo
LEFT JOIN Receta r   ON r.IdReceta     = cd.IdReceta;
GO

-- Vista 3: Progreso de medidas por paciente
CREATE OR ALTER VIEW VW_ProgresoMedidas AS
SELECT
    rm.PacienteEmail,
    pa.Nombre + ' ' + pa.Apellido1 AS NombrePaciente,
    rm.Fecha,
    rm.Cintura,
    rm.Cuello,
    rm.Caderas,
    rm.PorcentajeMusculo,
    rm.PorcentajeGrasa
FROM RegistroMedidas rm
INNER JOIN Paciente pa ON pa.Email = rm.PacienteEmail;
GO

-- ----------------------------------------------------------------------------
-- STORED PROCEDURES
-- ----------------------------------------------------------------------------

-- SP Obligatorio: Reporte de cobro para administrador (agrupado por tipo de cobro)
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

-- SP 2: Obtener registro diario de un paciente por fecha
CREATE OR ALTER PROCEDURE SP_RegistroDiarioPaciente
    @PacienteEmail VARCHAR(150),
    @Fecha         DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        cd.IdConsumo,
        cd.TiempoComida,
        ISNULL(p.Descripcion, r.NombreReceta) AS Item,
        cd.Cantidad,
        ISNULL(p.EnergiaKcal, r.CaloriasTotales) * cd.Cantidad AS Calorias,
        ISNULL(p.ProteinaG,   r.ProteinasTotales) * cd.Cantidad AS Proteinas,
        ISNULL(p.CarbohidratosG, r.CarbohidratosTotales) * cd.Cantidad AS Carbohidratos,
        ISNULL(p.GrasaG,      r.GrasasTotales) * cd.Cantidad AS Grasas
    FROM ConsumoDiario cd
    LEFT JOIN Producto p ON p.CodigoBarras = cd.ProductoCodigo
    LEFT JOIN Receta r   ON r.IdReceta     = cd.IdReceta
    WHERE cd.PacienteEmail = @PacienteEmail
      AND cd.Fecha = @Fecha
    ORDER BY
        CASE cd.TiempoComida
            WHEN 'Desayuno'        THEN 1
            WHEN 'Merienda Mañana' THEN 2
            WHEN 'Almuerzo'        THEN 3
            WHEN 'Merienda Tarde'  THEN 4
            WHEN 'Cena'            THEN 5
        END;
END;
GO

-- SP 3: Reporte de avance de medidas en un periodo
CREATE OR ALTER PROCEDURE SP_ReporteAvanceMedidas
    @PacienteEmail VARCHAR(150),
    @FechaInicio   DATE,
    @FechaFin      DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Fecha,
        Cintura,
        Cuello,
        Caderas,
        PorcentajeMusculo,
        PorcentajeGrasa
    FROM RegistroMedidas
    WHERE PacienteEmail = @PacienteEmail
      AND Fecha BETWEEN @FechaInicio AND @FechaFin
    ORDER BY Fecha ASC;
END;
GO

-- SP 4: Buscar productos por nombre o código de barras
CREATE OR ALTER PROCEDURE SP_BuscarProductos
    @Termino VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CodigoBarras,
        Descripcion,
        TamanoPorcion,
        UnidadMedida,
        EnergiaKcal,
        GrasaG,
        SodioMg,
        CarbohidratosG,
        ProteinaG,
        Vitaminas,
        CalcioMg,
        HierroMg,
        AprobadoPorAdministrador
    FROM Producto
    WHERE AprobadoPorAdministrador = 1
      AND (Descripcion   LIKE '%' + @Termino + '%'
        OR CodigoBarras  LIKE '%' + @Termino + '%')
    ORDER BY Descripcion;
END;
GO
