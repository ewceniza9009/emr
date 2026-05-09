using Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Controller for clinical operations including document generation and exports.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ClinicalController : ControllerBase
{
    private readonly IPdfService _pdfService;

    public ClinicalController(IPdfService pdfService)
    {
        _pdfService = pdfService;
    }

    /// <summary>
    /// Generates and exports a PDF summary for a specific clinical encounter.
    /// </summary>
    /// <param name="appointmentId">The unique identifier of the appointment/encounter.</param>
    /// <returns>A PDF file containing the encounter summary.</returns>
    /// <response code="200">Returns the PDF document.</response>
    /// <response code="400">If the generation fails or the ID is invalid.</response>
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

    /// <summary>
    /// Generates and exports a PDF invoice.
    /// </summary>
    /// <param name="invoiceId">The unique identifier of the invoice.</param>
    /// <returns>A PDF file containing the invoice.</returns>
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

    /// <summary>
    /// Generates and exports a comprehensive clinical dossier for a patient.
    /// </summary>
    /// <param name="patientId">The unique identifier of the patient.</param>
    /// <returns>A PDF file containing the patient's clinical history.</returns>
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
