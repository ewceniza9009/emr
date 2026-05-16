using Domain.Common;

namespace Domain.Entities;

public class SecurityAuditLog : BaseEntity, ITenantEntity
{
    public Guid SecurityAuditLogId { get; set; }
    public string Action { get; set; } = string.Empty; // e.g. "ROLE_ASSIGNED", "PERMISSION_UPDATED"
    public string ActorUserId { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string? TargetUserId { get; set; }
    public string? TargetName { get; set; }
    public string? Details { get; set; }
    public string? RecordDescription { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public Guid TenantId { get; set; }
}
