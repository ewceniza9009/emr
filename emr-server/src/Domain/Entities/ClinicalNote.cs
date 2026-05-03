using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class ClinicalNote : BaseEntity
{
    public Guid NoteId { get; set; } = Guid.NewGuid();
    public Guid EncounterId { get; set; }
    public Guid AuthorId { get; set; }
    public NoteType Type { get; set; } = NoteType.Progress;
    
    // Structured SOAP Note sections
    public string? Subjective { get; set; }
    public string? Objective { get; set; }
    public string? Assessment { get; set; }
    public string? Plan { get; set; }
    
    public string Content { get; set; } = string.Empty; // Full rendered note or fallback
    
    public bool IsSigned { get; set; }
    public string? SignatureHash { get; set; }
    public DateTimeOffset? SignedAt { get; set; }

    public ClinicalEncounter Encounter { get; set; } = null!;
    public Practitioner Author { get; set; } = null!;
}
