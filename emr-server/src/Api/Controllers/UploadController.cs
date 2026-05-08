using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IStorageService _storageService;
    private readonly IApplicationDbContext _context;

    public UploadController(IStorageService storageService, IApplicationDbContext context)
    {
        _storageService = storageService;
        _context = context;
    }

    [HttpPost("poa/{contactId}")]
    public async Task<IActionResult> UploadPoaDocument(Guid contactId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var contact = await _context.PatientContacts
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.ContactId == contactId);

        if (contact == null)
            return NotFound("Contact not found");

        if (!contact.HasPowerOfAttorney)
            return BadRequest("Contact is not a Power of Attorney representative");

        using var stream = file.OpenReadStream();
        var storageUrl = await _storageService.UploadFileAsync(
            stream, 
            file.FileName, 
            file.ContentType
        );

        var document = new PatientDocument
        {
            PatientId = contact.PatientId,
            PatientContactId = contact.ContactId,
            Title = $"POA - {file.FileName}",
            DocumentType = "POA",
            StorageUrl = storageUrl,
            ContentType = file.ContentType,
            FileSize = file.Length,
            UploadedAt = DateTimeOffset.UtcNow
        };

        _context.PatientDocuments.Add(document);
        await _context.SaveChangesAsync(default);

        return Ok(new { documentId = document.PatientDocumentId, url = storageUrl });
    }

    [HttpPost("general/{patientId}")]
    public async Task<IActionResult> UploadGeneralDocument(
        Guid patientId, 
        [FromForm] string title, 
        [FromForm] string documentType, 
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var patientExists = await _context.Patients
            .IgnoreQueryFilters()
            .AnyAsync(p => p.PatientId == patientId);
        if (!patientExists)
            return NotFound("Patient not found");

        using var stream = file.OpenReadStream();
        var storageUrl = await _storageService.UploadFileAsync(
            stream, 
            file.FileName, 
            file.ContentType
        );

        var document = new PatientDocument
        {
            PatientId = patientId,
            Title = title ?? file.FileName,
            DocumentType = documentType ?? "OTHER",
            StorageUrl = storageUrl,
            ContentType = file.ContentType,
            FileSize = file.Length,
            UploadedAt = DateTimeOffset.UtcNow
        };

        _context.PatientDocuments.Add(document);
        await _context.SaveChangesAsync(default);

        return Ok(new { documentId = document.PatientDocumentId, url = storageUrl });
    }

    [HttpGet("document/{documentId}")]
    public async Task<IActionResult> GetDocument(Guid documentId, [FromQuery] bool download = false)
    {
        var document = await _context.PatientDocuments
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.PatientDocumentId == documentId);

        if (document == null)
            return NotFound("Document record not found");

        try
        {
            var stream = await _storageService.DownloadFileAsync(document.StorageUrl);
            if (download)
            {
                var contentDisposition = new System.Net.Mime.ContentDisposition
                {
                    FileName = document.Title ?? "document",
                    Inline = false
                };
                Response.Headers.Append("Content-Disposition", contentDisposition.ToString());
                return File(stream, document.ContentType);
            }
            return File(stream, document.ContentType);
        }
        catch (Exception ex)
        {
            return NotFound($"Could not retrieve document: {ex.Message}");
        }
    }
}
