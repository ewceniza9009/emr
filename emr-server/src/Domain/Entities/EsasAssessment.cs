using Domain.Common;

namespace Domain.Entities;

public class EsasAssessment : BaseEntity
{
    public Guid AssessmentId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    
    // Scores are 0-10 based on ESAS-R standard
    public int Pain { get; set; }
    public int Tiredness { get; set; }
    public int Drowsiness { get; set; }
    public int Nausea { get; set; }
    public int LackOfAppetite { get; set; }
    public int ShortnessOfBreath { get; set; }
    public int Depression { get; set; }
    public int Anxiety { get; set; }
    public int Wellbeing { get; set; }
    
    public DateTimeOffset AssessedAt { get; set; } = DateTimeOffset.UtcNow;

    public Patient Patient { get; set; } = null!;
    public ClinicalEncounter? Encounter { get; set; }
}
