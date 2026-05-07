using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class CareNavigationCase : BaseEntity
{
    public Guid CaseId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public Guid NavigatorId { get; set; }
    public AcuityLevel AcuityLevel { get; set; } = AcuityLevel.Moderate;
    public CaseStatus Status { get; set; } = CaseStatus.Open;
    public DateTimeOffset OpenedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ClosedAt { get; set; }
    public string? ResolutionNotes { get; set; }

    public Patient Patient { get; set; } = null!;
    public Practitioner Navigator { get; set; } = null!;
    
    public ICollection<SdohAssessment> SdohAssessments { get; set; } = new List<SdohAssessment>();
    public ICollection<NavigationTask> Tasks { get; set; } = new List<NavigationTask>();
    public ICollection<BarrierLog> BarrierLogs { get; set; } = new List<BarrierLog>();
    public ICollection<InterventionLog> InterventionLogs { get; set; } = new List<InterventionLog>();
}
