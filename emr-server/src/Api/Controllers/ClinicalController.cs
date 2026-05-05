using Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClinicalController : ControllerBase
{
    private readonly IPdfService _pdfService;

    public ClinicalController(IPdfService pdfService)
    {
        _pdfService = pdfService;
    }

    [HttpGet("export/encounter/{appointmentId}")]
    public async Task<IActionResult> ExportEncounterSummary(Guid appointmentId)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateEncounterSummaryAsync(appointmentId);
            return File(pdfBytes, "application/pdf", $"encounter_{appointmentId}.pdf");
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
