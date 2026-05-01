using Domain.Enums;

namespace Domain.Entities;

public class Diagnosis
{
    public Guid DiagnosisId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public string Icd10Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTimeOffset DiagnosedAt { get; set; } = DateTimeOffset.UtcNow;

    public Patient Patient { get; set; } = null!;
    public ClinicalEncounter? Encounter { get; set; }
}
