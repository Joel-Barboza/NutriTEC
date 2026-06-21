-- ============================================================================
-- SCRIPT DE DATA INICIAL (INITIAL STATE / POPULATION) - NUTRI TEC
-- ============================================================================

-- 1. ADMINISTRADOR OBLIGATORIO
INSERT INTO Administrador (Email, PasswordEncriptado)
VALUES ('admin@nutritec.com', 'Admin1234');

-- 2. NUTRICIONISTA DE PRUEBA
INSERT INTO Nutricionista (CodigoNutricionista, Cedula, Nombre, Apellido1, Apellido2,
    FechaNacimiento, Peso, IMC, Direccion, Foto, NumeroTarjeta, TipoCobro, Email, PasswordEncriptado)
VALUES
('NUT-2026-01', '1-1234-5678', 'Mariela', 'Alvarado', 'Rojas',
 '1992-04-12', 62.50, 22.30, 'Cartago Centro, 300m Este de las Ruinas',
 NULL, '4000123456789010', 'Mensual', 'mariela@nutricion.cr', 'Mariela1234'),
('NUT-2026-02', '2-2345-6789', 'Carlos', 'Mora', 'Soto',
 '1985-08-20', 78.00, 24.50, 'San José, Barrio Escalante',
 NULL, '4000987654321098', 'Semanal', 'carlos@nutricion.cr', 'Carlos1234');

-- 3. PACIENTES DE PRUEBA
INSERT INTO Paciente (Email, Nombre, Apellido1, Apellido2, FechaNacimiento,
    PaisResidencia, PesoInicial, PesoActual, IMC, Cintura, Cuello, Caderas,
    PorcentajeMusculo, PorcentajeGrasa, ConsumoMaxCalorias, PasswordEncriptado)
VALUES
('joel@gmail.com', 'Joel', 'Barboza', 'Picado', '2004-02-04',
 'Costa Rica', 57.00, 61.40, 21.50, 82.00, 37.00, 95.00, 42.00, 18.00, 2000, 'joel1234'),
('maria@gmail.com', 'Maria', 'Lopez', 'Vargas', '1998-06-15',
 'Costa Rica', 65.00, 63.00, 23.10, 75.00, 33.00, 98.00, 38.00, 22.00, 1800, 'maria1234');

-- 4. PRODUCTOS BASE APROBADOS
INSERT INTO Producto (CodigoBarras, Descripcion, TamanoPorcion, UnidadMedida,
    EnergiaKcal, GrasaG, SodioMg, CarbohidratosG, ProteinaG, Vitaminas,
    CalcioMg, HierroMg, AprobadoPorAdministrador, CreadoPor)
VALUES
('7441001001234', 'Arroz Blanco Cocido',           100.00, 'g',  130, 0.30,   1.00, 28.00,  2.70, 'Vitamina B6',          10.00, 1.20, 1, 'admin@nutritec.com'),
('7441001005678', 'Frijoles Negros Cocidos',        100.00, 'g',  132, 0.50,   2.00, 23.00,  8.90, 'Hierro, Vitamina B1',  27.00, 3.70, 1, 'admin@nutritec.com'),
('7441001009999', 'Aceite Vegetal',                  14.00, 'g',  120, 14.00,  0.00,  0.00,  0.00, 'Vitamina E',            0.00, 0.00, 1, 'admin@nutritec.com'),
('7441001002222', 'Huevo Entero',                    50.00, 'g',   78,  5.00, 62.00,  0.60,  6.00, 'Vitamina D, B12',      25.00, 0.60, 1, 'admin@nutritec.com'),
('7441001004444', 'Leche Semidescremada Dos Pinos', 250.00, 'ml', 110,  3.00,120.00, 12.00,  8.00, 'Vitamina A, D',       300.00, 0.10, 1, 'admin@nutritec.com'),
('7441001006666', 'Pechuga de Pollo a la Plancha',  100.00, 'g',  165,  3.60, 74.00,  0.00, 31.00, 'Vitamina B3, B6',       11.00, 1.00, 1, 'admin@nutritec.com'),
('7441001007777', 'Banano',                         118.00, 'g',  105,  0.40,  1.00, 27.00,  1.30, 'Vitamina B6, C',         5.00, 0.30, 1, 'admin@nutritec.com'),
('7441001008888', 'Pan Integral',                    50.00, 'g',  120,  1.50,200.00, 22.00,  4.00, 'Vitamina B1, Hierro',   40.00, 1.40, 1, 'admin@nutritec.com');

-- 5. ASOCIAR PACIENTES A NUTRICIONISTAS
INSERT INTO PacienteNutricionista (PacienteEmail, NutricionistaCodigo, FechaAsociacion)
VALUES
('joel@gmail.com', 'NUT-2026-01', '2026-06-01'),
('maria@gmail.com', 'NUT-2026-01', '2026-06-05');

-- 6. RECETA DE EJEMPLO (Pinto)
INSERT INTO Receta (NombreReceta, CreadoPorEmail, CaloriasTotales, CarbohidratosTotales, ProteinasTotales, GrasasTotales)
VALUES ('Pinto Casero', 'joel@gmail.com', 280, 51.00, 11.60, 0.80);

DECLARE @IdPinto INT = SCOPE_IDENTITY();

INSERT INTO RecetaDetalle (IdReceta, ProductoCodigo, CantidadPorciones)
VALUES
(@IdPinto, '7441001001234', 1.00),
(@IdPinto, '7441001005678', 0.75),
(@IdPinto, '7441001009999', 0.25);

-- 7. MEDIDAS DE SEGUIMIENTO
INSERT INTO RegistroMedidas (PacienteEmail, Fecha, Cintura, Cuello, Caderas, PorcentajeMusculo, PorcentajeGrasa)
VALUES
('joel@gmail.com', '2026-06-01', 82.00, 37.00, 95.00, 42.00, 18.00),
('joel@gmail.com', '2026-06-08', 81.50, 36.80, 94.50, 42.50, 17.80),
('joel@gmail.com', '2026-06-15', 81.00, 36.50, 94.00, 43.00, 17.50);
GO
