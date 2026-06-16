using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoAPI.Data;
using MongoAPI.Models;

namespace MongoAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly NutritecMongoDbContext _context;

        public FeedbackController(NutritecMongoDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<Retroalimentacion>>> Get()
        {
            // Consultar todos los documentos de la colección
            var feedbacks = await _context.Retroalimentaciones.Find(_ => true).ToListAsync();
            return Ok(feedbacks);
        }
    }
}