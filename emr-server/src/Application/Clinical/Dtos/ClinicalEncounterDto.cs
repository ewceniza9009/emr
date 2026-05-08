using Domain.Enums;
using Application.Common.Dtos;

namespace Application.Clinical.Dtos;

public class ClinicalEncounterDto
{
    public Guid EncounterId { get; set; }
    public Guid PatientId { get; set; }
    public Guid PractitionerId { get; set; }
    public Guid? AppointmentId { get; set; }
    public EncounterType Type { get; set; }
    public EncounterStatus Status { get; set; }
    public DateTimeOffset EncounterDate { get; set; }
    public DateTimeOffset? AdmittedAt { get; set; }
    public DateTimeOffset? DischargedAt { get; set; }
    public ICollection<VitalSignDto> VitalSigns { get; set; } = new List<VitalSignDto>();
    public PractitionerDto? Practitioner { get; set; }
    public ICollection<ClinicalNoteDto> ClinicalNotes { get; set; } = new List<ClinicalNoteDto>();
}

public class ClinicalNoteDto
{
    public Guid NoteId { get; set; }
    public Guid EncounterId { get; set; }
    public NoteType Type { get; set; }
    public string? Subjective { get; set; }
    public string? Objective { get; set; }
    public string? Assessment { get; set; }
    public string? Plan { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsSigned { get; set; }
    public DateTimeOffset? SignedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
