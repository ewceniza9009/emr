using Domain.Enums;

namespace Domain.Entities;

public class PatientOutreach
{
    public Guid PatientOutreachId { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? ReferralSource { get; set; }
    public string? PrimaryPhone { get; set; }
    public string? PrimaryEmail { get; set; }
    public OutreachStatus Status { get; set; } = OutreachStatus.Lead;
    public DateTimeOffset? NextFollowUpDate { get; set; }
    public bool IsAccepted { get; set; }
    public DateTimeOffset? OrientationDate { get; set; }
    public CareModality? SelectedModality { get; set; }
    public Guid? HealthPlanId { get; set; }
    public CommunicationAbility? CommunicationStatus { get; set; }
    public TechAccessLevel? TechAccess { get; set; }
    public EnrollmentDisposition Disposition { get; set; } = EnrollmentDisposition.Cooperative;
    public string? BarriersToCare { get; set; } // Text description of financial/physical barriers
    public string? Notes { get; set; }
    public DateTimeOffset? LastActivityDate { get; set; }
    public int CallAttemptCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public HealthPlan? HealthPlan { get; set; }
    public ICollection<OutreachActivity> Activities { get; set; } = new List<OutreachActivity>();
    public Guid? AssignedPractitionerId { get; set; }
    
    // Once enrolled, link to the actual patient record
    public Guid? EnrolledPatientId { get; set; }
    
    public Practitioner? AssignedPractitioner { get; set; }
    public Patient? EnrolledPatient { get; set; }
}
