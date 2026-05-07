using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class PatientDocument : BaseEntity, ITenantEntity
{
    public Guid PatientDocumentId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? PatientContactId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty; // e.g. "Hospital Discharge", "Consent", "ID Card"
    public string StorageUrl { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long FileSize { get; set; }
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid? UploadedById { get; set; }
    
    public Patient Patient { get; set; } = null!;
    public PatientContact? Contact { get; set; }
    public Practitioner? UploadedBy { get; set; }
}
