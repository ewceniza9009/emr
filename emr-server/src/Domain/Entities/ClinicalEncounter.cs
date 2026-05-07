using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class ClinicalEncounter : BaseEntity, ITenantEntity
{
    public Guid EncounterId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public Guid PractitionerId { get; set; }
    public Guid? AppointmentId { get; set; }
    public EncounterType Type { get; set; } = EncounterType.RoutineFollowUp;
    public EncounterStatus Status { get; set; } = EncounterStatus.Planned;
    public int? PpsScore { get; set; }
    public DateTimeOffset EncounterDate { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? AdmittedAt { get; set; }
    public DateTimeOffset? DischargedAt { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    
    public Patient Patient { get; set; } = null!;
    public Practitioner Practitioner { get; set; } = null!;
    public Appointment? Appointment { get; set; }
    
    public ICollection<Diagnosis> Diagnoses { get; set; } = new List<Diagnosis>();
    public ICollection<VitalSign> VitalSigns { get; set; } = new List<VitalSign>();
    public ICollection<ClinicalNote> ClinicalNotes { get; set; } = new List<ClinicalNote>();
}
