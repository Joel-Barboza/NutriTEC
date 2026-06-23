using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.DTOs;
using SQL_API.Models;
using SQL_API.Security;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public AdminController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/admin
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var administradores = await _context.Administradores.AsNoTracking().ToListAsync();
            return Ok(administradores.Select(ToAdminSeguro));
        }

        // POST: api/admin/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { mensaje = "Debe enviar correo y contraseña." });

            var emailNormalizado = request.Email.Trim().ToLower();

            var admin = await _context.Administradores
                .FirstOrDefaultAsync(a => a.Email.ToLower() == emailNormalizado);

            if (admin == null)
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });

            var passwordValida = await ValidarPasswordAdminAsync(admin, request.Password);

            if (!passwordValida)
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });

            return Ok(ToAdminSeguro(admin));
        }

        private async Task<bool> ValidarPasswordAdminAsync(Administrador admin, string passwordIngresado)
        {
            if (PasswordSecurity.VerifyPassword(passwordIngresado, admin.PasswordEncriptado))
                return true;

            // Compatibilidad con datos viejos: si estaba en texto plano, permite el login una vez
            // y reemplaza inmediatamente el valor por hash.
            if (PasswordSecurity.VerifyLegacyPlainText(passwordIngresado, admin.PasswordEncriptado))
            {
                admin.PasswordEncriptado = PasswordSecurity.HashPassword(passwordIngresado);
                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }

        private static object ToAdminSeguro(Administrador admin)
        {
            return new
            {
                admin.Email,
                PasswordEncriptado = string.Empty
            };
        }
    }
}
