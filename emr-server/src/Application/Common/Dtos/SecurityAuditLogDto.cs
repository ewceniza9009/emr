namespace Application.Common.Dtos;

public class SecurityAuditLogDto
{
    public Guid AuditLogId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? TargetUserId { get; set; }
    public string? TargetName { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTimeOffset Timestamp { get; set; }
}
