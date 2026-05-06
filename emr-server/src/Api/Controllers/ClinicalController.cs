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

    [HttpGet("export/invoice/{invoiceId}")]
    public async Task<IActionResult> ExportInvoice(Guid invoiceId)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateInvoiceAsync(invoiceId);
            return File(pdfBytes, "application/pdf", $"invoice_{invoiceId}.pdf");
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("export/dossier/{patientId}")]
    public async Task<IActionResult> ExportPatientDossier(Guid patientId)
    {
        try
        {
            var pdfBytes = await _pdfService.GeneratePatientDossierAsync(patientId);
            return File(pdfBytes, "application/pdf", $"dossier_{patientId}.pdf");
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
