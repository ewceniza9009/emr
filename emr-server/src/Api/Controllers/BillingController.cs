using Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly IPdfService _pdfService;

    public BillingController(IPdfService pdfService)
    {
        _pdfService = pdfService;
    }

    [HttpGet("export/invoice/{id}")]
    public async Task<IActionResult> ExportInvoice(Guid id)
    {
        try
        {
            var pdf = await _pdfService.GenerateInvoiceAsync(id);
            return File(pdf, "application/pdf", $"invoice_{id}.pdf");
        }
        catch (Exception ex)
        {
            return NotFound(ex.Message);
        }
    }
}
