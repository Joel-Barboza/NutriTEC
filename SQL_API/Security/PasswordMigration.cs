using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SQL_API.Models;

namespace SQL_API.Security
{
    public static class PasswordMigration
    {
        public static async Task HashLegacyPasswordsAsync(IServiceProvider services)
        {
            try
            {
                using var scope = services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<NutritecDbContext>();
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));

                var huboCambios = false;

                var pacientes = await context.Pacientes.ToListAsync(timeout.Token);
                foreach (var paciente in pacientes)
                {
                    if (DebeMigrar(paciente.PasswordEncriptado))
                    {
                        paciente.PasswordEncriptado = PasswordSecurity.HashPassword(paciente.PasswordEncriptado);
                        huboCambios = true;
                    }
                }

                var nutricionistas = await context.Nutricionistas.ToListAsync(timeout.Token);
                foreach (var nutricionista in nutricionistas)
                {
                    if (DebeMigrar(nutricionista.PasswordEncriptado))
                    {
                        nutricionista.PasswordEncriptado = PasswordSecurity.HashPassword(nutricionista.PasswordEncriptado);
                        huboCambios = true;
                    }
                }

                var administradores = await context.Administradores.ToListAsync(timeout.Token);
                foreach (var admin in administradores)
                {
                    if (DebeMigrar(admin.PasswordEncriptado))
                    {
                        admin.PasswordEncriptado = PasswordSecurity.HashPassword(admin.PasswordEncriptado);
                        huboCambios = true;
                    }
                }

                if (huboCambios)
                {
                    await context.SaveChangesAsync(timeout.Token);
                }
            }
            catch
            {
                // La API no se detiene si la base no está disponible en ese momento.
                // En el siguiente login exitoso también se migra automáticamente la contraseña del usuario.
            }
        }

        private static bool DebeMigrar(string? passwordGuardada)
        {
            return !string.IsNullOrWhiteSpace(passwordGuardada) &&
                   !PasswordSecurity.IsNutritecHash(passwordGuardada);
        }
    }
}
