using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class NavigationTask : BaseEntity, ITenantEntity
{
    public Guid TaskId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid CaseId { get; set; }
    public Guid AssignedToId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset DueDate { get; set; }
    public NavigationTaskStatus Status { get; set; } = NavigationTaskStatus.Pending;

    public CareNavigationCase CareNavigationCase { get; set; } = null!;
    public Practitioner AssignedTo { get; set; } = null!;
}
