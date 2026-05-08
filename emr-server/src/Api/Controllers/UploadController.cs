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
    public async Task<IActionResult> UploadPoaDocument(Guid contactId, [FromForm] IFormFile file)
    {
        Console.WriteLine($"[UploadController] Received POA upload request for Contact: {contactId}");
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

        // CLEANUP: Find and remove any existing POA for this contact to prevent storage bloat
        var existingPoa = await _context.PatientDocuments
            .FirstOrDefaultAsync(d => d.PatientContactId == contactId && (d.DocumentType == "POA" || d.Title.Contains("POA")));

        if (existingPoa != null)
        {
            // Delete the physical blob from Azurite
            await _storageService.DeleteFileAsync(existingPoa.StorageUrl);
            // Remove the record from DB
            _context.PatientDocuments.Remove(existingPoa);
        }

        var document = new PatientDocument
        {
            PatientId = contact.PatientId,
            PatientContactId = contact.ContactId,
            TenantId = contact.TenantId,
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
        [FromForm] IFormFile file)
    {
        Console.WriteLine($"[UploadController] Received General upload request for Patient: {patientId} (Title: {title}, Type: {documentType})");
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var patient = await _context.Patients
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.PatientId == patientId);
        if (patient == null)
            return NotFound("Patient not found");

        var resolvedTitle = title ?? file.FileName;

        // DEDUPLICATION: Remove any existing document with the exact same title for this patient
        var existingDoc = await _context.PatientDocuments
            .FirstOrDefaultAsync(d => d.PatientId == patientId && d.Title == resolvedTitle);

        if (existingDoc != null)
        {
            Console.WriteLine($"[UploadController] Found duplicate document '{resolvedTitle}'. Purging before upload...");
            await _storageService.DeleteFileAsync(existingDoc.StorageUrl);
            _context.PatientDocuments.Remove(existingDoc);
            // Save changes here so the remove takes effect before we add the new one, avoiding unique constraint issues if any
            await _context.SaveChangesAsync(default);
        }

        using var stream = file.OpenReadStream();
        var storageUrl = await _storageService.UploadFileAsync(
            stream, 
            file.FileName, 
            file.ContentType
        );

        var document = new PatientDocument
        {
            PatientId = patientId,
            TenantId = patient.TenantId,
            Title = resolvedTitle,
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
        Console.WriteLine($"[UploadController] Requesting document: {documentId}");
        var document = await _context.PatientDocuments
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.PatientDocumentId == documentId);

        if (document == null)
        {
            Console.WriteLine($"[UploadController] Document NOT FOUND in database: {documentId}");
            return NotFound("Document record not found");
        }

        Console.WriteLine($"[UploadController] Found document: {document.Title}. StorageUrl: {document.StorageUrl}");

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
                return File(stream, document.ContentType ?? "application/octet-stream");
            }
            return File(stream, document.ContentType ?? "application/octet-stream");
        }
        catch (Exception ex)
        {
            return NotFound($"Could not retrieve document: {ex.Message}");
        }
    }
}
