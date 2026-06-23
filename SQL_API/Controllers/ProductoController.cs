using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_API.Models;

namespace SQL_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductoController : ControllerBase
    {
        private readonly NutritecDbContext _context;

        public ProductoController(NutritecDbContext context)
        {
            _context = context;
        }

        // GET: api/producto  — todos los productos
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var productos = await _context.Productos.ToListAsync();
            return Ok(productos);
        }

        // GET: api/producto/aprobados  — solo aprobados
        [HttpGet("aprobados")]
        public async Task<IActionResult> GetAprobados()
        {
            var productos = await _context.Productos
                .Where(p => p.AprobadoPorAdministrador)
                .OrderBy(p => p.Descripcion)
                .ToListAsync();
            return Ok(productos);
        }

        // GET: api/producto/pendientes  — para admin
        [HttpGet("pendientes")]
        public async Task<IActionResult> GetPendientes()
        {
            var productos = await _context.Productos
                .Where(p => !p.AprobadoPorAdministrador)
                .OrderBy(p => p.Descripcion)
                .ToListAsync();
            return Ok(productos);
        }

        // GET: api/producto/buscar?termino=arroz  — por nombre o código
        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar([FromQuery] string termino)
        {
            if (string.IsNullOrWhiteSpace(termino))
                return BadRequest(new { mensaje = "El término de búsqueda es requerido." });

            var productos = await _context.Productos
                .Where(p => p.AprobadoPorAdministrador &&
                    (p.Descripcion.Contains(termino) || p.CodigoBarras.Contains(termino)))
                .OrderBy(p => p.Descripcion)
                .ToListAsync();

            return Ok(productos);
        }

        // GET: api/producto/{codigo}
        [HttpGet("{codigo}")]
        public async Task<IActionResult> GetByCodigo(string codigo)
        {
            var producto = await _context.Productos
                .FirstOrDefaultAsync(p => p.CodigoBarras == codigo);

            if (producto == null)
                return NotFound(new { mensaje = "Producto no encontrado." });

            return Ok(producto);
        }

        // POST: api/producto
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Producto nuevoProducto)
        {
            var existe = await _context.Productos
                .AnyAsync(p => p.CodigoBarras == nuevoProducto.CodigoBarras);

            if (existe)
                return Conflict(new { mensaje = "Ya existe un producto con ese código de barras." });

            nuevoProducto.AprobadoPorAdministrador = false;
            _context.Productos.Add(nuevoProducto);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Producto creado. Pendiente de aprobación por el administrador." });
        }

        // PUT: api/producto/{codigo}/aprobar  — para admin
        [HttpPut("{codigo}/aprobar")]
        public async Task<IActionResult> Aprobar(string codigo)
        {
            var producto = await _context.Productos
                .FirstOrDefaultAsync(p => p.CodigoBarras == codigo);

            if (producto == null)
                return NotFound(new { mensaje = "Producto no encontrado." });

            producto.AprobadoPorAdministrador = true;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Producto aprobado exitosamente." });
        }

        // PUT: api/producto/{codigo}
        [HttpPut("{codigo}")]
        public async Task<IActionResult> Update(string codigo, [FromBody] Producto productoActualizado)
        {
            var producto = await _context.Productos
                .FirstOrDefaultAsync(p => p.CodigoBarras == codigo);

            if (producto == null)
                return NotFound(new { mensaje = "Producto no encontrado." });

                producto.Descripcion = productoActualizado.Descripcion;
                producto.TamanoPorcion = productoActualizado.TamanoPorcion;
                producto.UnidadMedida = productoActualizado.UnidadMedida;
                producto.EnergiaKcal = productoActualizado.EnergiaKcal;
                producto.GrasaG = productoActualizado.GrasaG;
                producto.SodioMg = productoActualizado.SodioMg;
                producto.CarbohidratosG = productoActualizado.CarbohidratosG;
                producto.ProteinaG = productoActualizado.ProteinaG;
                producto.Vitaminas = productoActualizado.Vitaminas;
                producto.CalcioMg = productoActualizado.CalcioMg;
                producto.HierroMg = productoActualizado.HierroMg;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Producto actualizado correctamente." });
        }

        // DELETE: api/producto/{codigo}
        [HttpDelete("{codigo}")]
        public async Task<IActionResult> Delete(string codigo)
        {
            var producto = await _context.Productos
                .FirstOrDefaultAsync(p => p.CodigoBarras == codigo);

            if (producto == null)
                return NotFound(new { mensaje = "Producto no encontrado." });

            producto.AprobadoPorAdministrador = false;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Producto eliminado correctamente." });
        }
    }
}
