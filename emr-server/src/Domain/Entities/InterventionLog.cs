using Domain.Common;

namespace Domain.Entities;

public class InterventionLog : BaseEntity
{
    public Guid InterventionId { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public string ActionTaken { get; set; } = string.Empty;
    public DateTimeOffset LoggedAt { get; set; } = DateTimeOffset.UtcNow;

    public CareNavigationCase CareNavigationCase { get; set; } = null!;
}
