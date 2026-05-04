using Domain.Common;

namespace Domain.Entities;

public class SpiritualAssessment : BaseEntity
{
    public Guid SpiritualAssessmentId { get; set; } = Guid.NewGuid();
    public Guid EncounterId { get; set; }
    public Guid PatientId { get; set; }
    
    // FICA Framework
    public string? Faith { get; set; } // Faith/Belief
    public string? Importance { get; set; } // Importance/Influence
    public string? Community { get; set; } // Community
    public string? AddressInCare { get; set; } // Address in Care
    
    public string? ReligiousPreference { get; set; }
    public string? ClergyContact { get; set; }
    
    public ClinicalEncounter ClinicalEncounter { get; set; } = null!;
    public Patient Patient { get; set; } = null!;
}
