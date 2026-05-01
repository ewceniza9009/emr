using Domain.Enums;

namespace Domain.Entities;

public class ClinicalNote
{
    public Guid NoteId { get; set; } = Guid.NewGuid();
    public Guid EncounterId { get; set; }
    public Guid AuthorId { get; set; }
    public NoteType Type { get; set; } = NoteType.Progress;
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsSigned { get; set; }

    public ClinicalEncounter Encounter { get; set; } = null!;
    public Practitioner Author { get; set; } = null!;
}
