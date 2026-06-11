-- ============================================================================
-- SCRIPT DE CREACIÓN DE ESTRUCTURA (EMPTY STATE) - NUTRI TEC
-- METODOLOGÍA: ALTER TABLE PARA RESTRICCIONES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ELIMINACIÓN DE TABLAS (En orden inverso para evitar conflictos)
-- ----------------------------------------------------------------------------
--DROP TABLE IF EXISTS ConsumoDiario;
--DROP TABLE IF EXISTS RecetaDetalle;
--DROP TABLE IF EXISTS Receta;
--DROP TABLE IF EXISTS PlanDetalle;
--DROP TABLE IF EXISTS PlanAlimentacion;
--DROP TABLE IF EXISTS PacienteNutricionista;
--DROP TABLE IF EXISTS Producto;
--DROP TABLE IF EXISTS RegistroMedidas;
DROP TABLE IF EXISTS Paciente;
--DROP TABLE IF EXISTS Nutricionista;
--DROP TABLE IF EXISTS Administrador;
GO

-- ----------------------------------------------------------------------------
-- CREACIÓN DE TABLAS BASE (Solo Columnas y Llaves Primarias)
-- ----------------------------------------------------------------------------

--CREATE TABLE Administrador (
--    Email VARCHAR(150) NOT NULL,
--    PasswordEncriptado VARCHAR(255) NOT NULL,
--    PRIMARY KEY (Email)
--);

--CREATE TABLE Nutricionista (
--    Cedula VARCHAR(20) NOT NULL,
--    Nombre VARCHAR(50) NOT NULL,
--    Apellidos VARCHAR(100) NOT NULL,
--    CodigoNutricionista VARCHAR(20) NOT NULL,
--    Edad INT NOT NULL,
--    FechaNacimiento DATE NOT NULL,
--    PesoDecimal DECIMAL(5,2) NOT NULL,
--    IMC DECIMAL(4,2) NOT NULL,
--    Direccion VARCHAR(255) NOT NULL,
--    Foto VARCHAR(MAX) NULL,
--    NumeroTarjeta VARCHAR(20) NOT NULL,
--    TipoCobro VARCHAR(15) NOT NULL,
--    Email VARCHAR(150) NOT NULL,
--    PasswordEncriptado VARCHAR(255) NOT NULL,
--    PRIMARY KEY (Cedula)
--);

CREATE TABLE Paciente (
    Email VARCHAR(150) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Apellido1 VARCHAR(50) NOT NULL,
    Apellido2 VARCHAR(50) NOT NULL,
    Edad INT NOT NULL,
    FechaNacimiento DATE NOT NULL,
    PaisResidencia VARCHAR(50) NOT NULL,
    PesoInicial DECIMAL(5,2) NOT NULL,
    PesoActual DECIMAL(5,2) NOT NULL,
    ConsumoMaxCalorias INT NOT NULL,
    PasswordEncriptado VARCHAR(255) NOT NULL,
    PRIMARY KEY (Email)
);

--CREATE TABLE RegistroMedidas (
--    IdRegistro INT IDENTITY(1,1) NOT NULL,
--    PacienteEmail VARCHAR(150) NOT NULL,
--    Fecha DATE NOT NULL,
--    Cintura DECIMAL(5,2) NOT NULL,
--    Cuello DECIMAL(5,2) NOT NULL,
--    Caderas DECIMAL(5,2) NOT NULL,
--    PorcentajeMusculo DECIMAL(4,2) NOT NULL,
--    PorcentajeGrasa DECIMAL(4,2) NOT NULL,
--    PRIMARY KEY (IdRegistro)
--);

--CREATE TABLE Producto (
--    CodigoBarras VARCHAR(50) NOT NULL,
--    Descripcion VARCHAR(150) NOT NULL,
--    TamanoPorcion DECIMAL(6,2) NOT NULL,
--    UnidadMedida VARCHAR(10) NOT NULL,
--    EnergiaKcal INT NOT NULL,
--    GrasaG DECIMAL(5,2) NOT NULL,
--    SodioMg DECIMAL(6,2) NOT NULL,
--    CarbohidratosG DECIMAL(5,2) NOT NULL,
--    ProteinaG DECIMAL(5,2) NOT NULL,
--    Vitaminas VARCHAR(255) NULL,
--    CalcioMg DECIMAL(6,2) NOT NULL,
--    HierroMg DECIMAL(6,2) NOT NULL,
--    AprobadoPorAdministrador BIT NOT NULL DEFAULT 0,
--    CreadoPor VARCHAR(150) NOT NULL,
--    PRIMARY KEY (CodigoBarras)
--);

--CREATE TABLE PacienteNutricionista (
--    PacienteEmail VARCHAR(150) NOT NULL,
--    NutricionistaCedula VARCHAR(20) NOT NULL,
--    FechaAsociacion DATE NOT NULL DEFAULT GETDATE(),
--    PRIMARY KEY (PacienteEmail)
--);

--CREATE TABLE PlanAlimentacion (
--    IdPlan INT IDENTITY(1,1) NOT NULL,
--    NombrePlan VARCHAR(100) NOT NULL,
--    NutricionistaCedula VARCHAR(20) NOT NULL,
--    CaloriasTotales INT NOT NULL DEFAULT 0,
--    PRIMARY KEY (IdPlan)
--);

--CREATE TABLE PlanDetalle (
--    IdPlanDetalle INT IDENTITY(1,1) NOT NULL,
--    IdPlan INT NOT NULL,
--    TiempoComida VARCHAR(20) NOT NULL,
--    ProductoCodigo VARCHAR(50) NOT NULL,
--    Porciones INT NOT NULL DEFAULT 1,
--    PRIMARY KEY (IdPlanDetalle)
--);

--CREATE TABLE Receta (
--    IdReceta INT IDENTITY(1,1) NOT NULL,
--    NombreReceta VARCHAR(100) NOT NULL,
--    CreadoPorEmail VARCHAR(150) NOT NULL,
--    CaloriasTotales INT NOT NULL DEFAULT 0,
--    CarbohidratosTotales DECIMAL(5,2) NOT NULL DEFAULT 0,
--    ProteinasTotales DECIMAL(5,2) NOT NULL DEFAULT 0,
--    GrasasTotales DECIMAL(5,2) NOT NULL DEFAULT 0,
--    PRIMARY KEY (IdReceta)
--);

--CREATE TABLE RecetaDetalle (
--    IdRecetaDetalle INT IDENTITY(1,1) NOT NULL,
--    IdReceta INT NOT NULL,
--    ProductoCodigo VARCHAR(50) NOT NULL,
--    CantidadPorciones DECIMAL(4,2) NOT NULL,
--    PRIMARY KEY (IdRecetaDetalle)
--);

--CREATE TABLE ConsumoDiario (
--    IdConsumo INT IDENTITY(1,1) NOT NULL,
--    PacienteEmail VARCHAR(150) NOT NULL,
--    Fecha DATE NOT NULL DEFAULT GETDATE(),
--    TiempoComida VARCHAR(20) NOT NULL,
--    ProductoCodigo VARCHAR(50) NULL,
--    IdReceta INT NULL,
--    Cantidad DECIMAL(4,2) NOT NULL DEFAULT 1,
--    PRIMARY KEY (IdConsumo)
--);
--GO

---- ----------------------------------------------------------------------------
---- ASIGNACIÓN DE RESTRICCIONES (ALTER TABLE)
---- ----------------------------------------------------------------------------

---- Restricciones Únicas y de Validación para Nutricionista
--ALTER TABLE Nutricionista
--ADD CONSTRAINT UQ_Nutricionista_Codigo UNIQUE (CodigoNutricionista);

--ALTER TABLE Nutricionista
--ADD CONSTRAINT UQ_Nutricionista_Email UNIQUE (Email);

--ALTER TABLE Nutricionista
--ADD CONSTRAINT CK_Nutricionista_TipoCobro CHECK (TipoCobro IN ('Semanal', 'Mensual', 'Anual'));

---- Restricciones para RegistroMedidas
--ALTER TABLE RegistroMedidas
--ADD CONSTRAINT FK_Medidas_Paciente
--FOREIGN KEY (PacienteEmail) REFERENCES Paciente(Email) ON DELETE CASCADE;

--ALTER TABLE RegistroMedidas
--ADD CONSTRAINT UQ_Paciente_Fecha_Medida UNIQUE (PacienteEmail, Fecha);

---- Restricciones para Producto
--ALTER TABLE Producto
--ADD CONSTRAINT CK_Producto_UnidadMedida CHECK (UnidadMedida IN ('g', 'ml'));

---- Restricciones para PacienteNutricionista
--ALTER TABLE PacienteNutricionista
--ADD CONSTRAINT FK_Asoc_Paciente
--FOREIGN KEY (PacienteEmail) REFERENCES Paciente(Email);

--ALTER TABLE PacienteNutricionista
--ADD CONSTRAINT FK_Asoc_Nutricionista
--FOREIGN KEY (NutricionistaCedula) REFERENCES Nutricionista(Cedula);

---- Restricciones para PlanAlimentacion
--ALTER TABLE PlanAlimentacion
--ADD CONSTRAINT FK_Plan_Nutricionista
--FOREIGN KEY (NutricionistaCedula) REFERENCES Nutricionista(Cedula) ON DELETE CASCADE;

---- Restricciones para PlanDetalle
--ALTER TABLE PlanDetalle
--ADD CONSTRAINT FK_Detalle_Plan
--FOREIGN KEY (IdPlan) REFERENCES PlanAlimentacion(IdPlan) ON DELETE CASCADE;

--ALTER TABLE PlanDetalle
--ADD CONSTRAINT FK_Detalle_Producto
--FOREIGN KEY (ProductoCodigo) REFERENCES Producto(CodigoBarras);

--ALTER TABLE PlanDetalle
--ADD CONSTRAINT CK_Detalle_TiempoComida CHECK (TiempoComida IN ('Desayuno', 'Merienda Mañana', 'Almuerzo', 'Merienda Tarde', 'Cena'));

---- Restricciones para RecetaDetalle
--ALTER TABLE RecetaDetalle
--ADD CONSTRAINT FK_RecetaDetalle_Receta
--FOREIGN KEY (IdReceta) REFERENCES Receta(IdReceta) ON DELETE CASCADE;

--ALTER TABLE RecetaDetalle
--ADD CONSTRAINT FK_RecetaDetalle_Producto
--FOREIGN KEY (ProductoCodigo) REFERENCES Producto(CodigoBarras);

---- Restricciones para ConsumoDiario
--ALTER TABLE ConsumoDiario
--ADD CONSTRAINT FK_Consumo_Paciente
--FOREIGN KEY (PacienteEmail) REFERENCES Paciente(Email) ON DELETE CASCADE;

--ALTER TABLE ConsumoDiario
--ADD CONSTRAINT FK_Consumo_Producto
--FOREIGN KEY (ProductoCodigo) REFERENCES Producto(CodigoBarras);

---- Corrección del Constraint de Integridad de Negocio para ConsumoDiario
--ALTER TABLE ConsumoDiario
--ADD CONSTRAINT FK_Consumo_Receta
--FOREIGN KEY (IdReceta) REFERENCES Receta(IdReceta);

--ALTER TABLE ConsumoDiario
--ADD CONSTRAINT CK_Consumo_TiempoComida CHECK (TiempoComida IN ('Desayuno', 'Merienda Mañana', 'Almuerzo', 'Merienda Tarde', 'Cena'));

--ALTER TABLE ConsumoDiario
--ADD CONSTRAINT CK_Consumo_MutuamenteExcluyente CHECK (
--    (ProductoCodigo IS NOT NULL AND IdReceta IS NULL) OR 
--    (ProductoCodigo IS NULL AND IdReceta IS NOT NULL)
--);
--GO