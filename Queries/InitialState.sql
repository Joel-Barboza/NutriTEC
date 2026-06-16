-- ============================================================================
-- SCRIPT DE DATA INICIAL (INITIAL STATE / POPULATION) - NUTRI TEC
-- ============================================================================

---- 1. INSERTAR ADMINISTRADOR OBLIGATORIO (Requerimiento del enunciado [cite: 70])
--INSERT INTO Administrador (Email, PasswordEncriptado)
--VALUES ('admin@nutritec.com', 'AQAAAAEAACcQAAAAEGlfU211YXRQYXNzX0VuY3J5cHRlZCE=');

---- 2. INSERTAR PRODUCTOS BASE (Aprobados listos para pruebas del pinto o recetas [cite: 55])
--INSERT INTO Producto (CodigoBarras, Descripcion, TamanoPorcion, UnidadMedida, EnergiaKcal, GrasaG, SodioMg, CarbohidratosG, ProteinaG, Vitaminas, CalcioMg, HierroMg, AprobadoPorAdministrador, CreadoPor)
--VALUES 
--('7441001001234', 'Arroz Blanco Cocido', 100.00, 'g', 130, 0.30, 1.00, 28.00, 2.70, 'Vitamina B6', 10.00, 1.20, 1, 'admin@nutritec.com'),
--('7441001005678', 'Frijoles Negros Cocidos', 100.00, 'g', 132, 0.50, 2.00, 23.00, 8.90, 'Hierro, Vitamina B1', 27.00, 3.70, 1, 'admin@nutritec.com'),
--('7441001009999', 'Aceite Vegetal', 14.00, 'g', 120, 14.00, 0.00, 0.00, 0.00, 'Vitamina E', 0.00, 0.00, 1, 'admin@nutritec.com'),
--('7441001002222', 'Huevo Entero San Marino', 50.00, 'g', 78, 5.00, 62.00, 0.60, 6.00, 'Vitamina D, B12', 25.00, 0.60, 1, 'admin@nutritec.com'),
--('7441001004444', 'Leche Semidescremada Dos Pinos', 250.00, 'ml', 110, 3.00, 120.00, 12.00, 8.00, 'Vitamina A, D', 300.00, 0.10, 1, 'admin@nutritec.com');

---- 3. INSERTAR UN NUTRICIONISTA DE PRUEBA (Para validar el cobro semanal/mensual/anual [cite: 31, 66])
--INSERT INTO Nutricionista (Cedula, Nombre, Apellidos, CodigoNutricionista, Edad, FechaNacimiento, PesoDecimal, IMC, Direccion, Foto, NumeroTarjeta, TipoCobro, Email, PasswordEncriptado)
--VALUES 
--('1-1234-5678', 'Mariela', 'Alvarado Rojas', 'NUT-2026-09', 34, '1992-04-12', 62.50, 22.30, 'Cartago Centro, 300m Este de las Ruinas', NULL, '4000123456789010', 'Mensual', 'malvarado@nutricion.cr', 'AQAAAAEAACcQAAAAEGxndXRpZXJyZXpQYXNzMTIzIQ==');

-- 4. INSERTAR UN PACIENTE DE PRUEBA
--INSERT INTO Paciente (Email, Nombre, Apellido1, Apellido2, FechaNacimiento, PaisResidencia, PesoInicial, PesoActual, ConsumoMaxCalorias, PasswordEncriptado)
--VALUES 
--('joel@gmail.com', 'Joel', 'Barboza', 'Picado', '2004-02-04', 'Costa Rica', 57.00, 61.40, 2000, 'joel1234');

--INSERT INTO Paciente (Email, Nombre, Apellido1, Apellido2, FechaNacimiento, PaisResidencia, PesoInicial, PesoActual, ConsumoMaxCalorias, PasswordEncriptado)
--VALUES 
--('pedro@gmail.com', 'Pedro', 'Perico', 'Perico', '2001-02-04', 'Costa Rica', 570.00, 0.40, 2, 'pericoelguapo1234');



---- 5. ASOCIAR EL PACIENTE AL NUTRICIONISTA (Poblar la tabla intermedia de asignación [cite: 35])
--INSERT INTO PacienteNutricionista(PacienteEmail, NutricionistaCedula, FechaAsociacion)
--VALUES ('joebarboza@estudiantec.cr', '1-1234-5678', '2026-06-11');
--GO