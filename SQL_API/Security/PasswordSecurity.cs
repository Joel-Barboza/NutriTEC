using System.Security.Cryptography;
using System.Text;

namespace SQL_API.Security
{
    public static class PasswordSecurity
    {
        private const int SaltSize = 16;
        private const int HashSize = 32;
        private const int Iterations = 100_000;
        private const string Prefix = "PBKDF2$SHA256";

        public static string HashPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentException("La contraseña no puede estar vacía.", nameof(password));

            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                Iterations,
                HashAlgorithmName.SHA256,
                HashSize);

            return $"{Prefix}${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        public static bool IsNutritecHash(string? storedPassword)
        {
            return !string.IsNullOrWhiteSpace(storedPassword) &&
                   storedPassword.StartsWith(Prefix + "$", StringComparison.Ordinal);
        }

        public static bool VerifyPassword(string password, string? storedPassword)
        {
            if (string.IsNullOrWhiteSpace(password) || !IsNutritecHash(storedPassword))
                return false;

            var parts = storedPassword!.Split('$');
            if (parts.Length != 5)
                return false;

            if (!int.TryParse(parts[2], out var iterations))
                return false;

            try
            {
                var salt = Convert.FromBase64String(parts[3]);
                var expectedHash = Convert.FromBase64String(parts[4]);

                var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                    password,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA256,
                    expectedHash.Length);

                return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
            }
            catch
            {
                return false;
            }
        }

        public static bool VerifyLegacyPlainText(string password, string? storedPassword)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(storedPassword))
                return false;

            if (IsNutritecHash(storedPassword))
                return false;

            var passwordBytes = Encoding.UTF8.GetBytes(password);
            var storedBytes = Encoding.UTF8.GetBytes(storedPassword);

            return passwordBytes.Length == storedBytes.Length &&
                   CryptographicOperations.FixedTimeEquals(passwordBytes, storedBytes);
        }
    }
}
