using System;

namespace Application.Patients.Dtos;

public class PatientDocumentDto
{
    public Guid PatientDocumentId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? PatientContactId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string StorageUrl { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long FileSize { get; set; }
    public DateTimeOffset UploadedAt { get; set; }
}
