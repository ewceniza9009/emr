using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Notification : BaseEntity
{
    public Guid NotificationId { get; set; } = Guid.NewGuid();
    public string? UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public bool IsRead { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public string? ActionUrl { get; set; }
    public string? Icon { get; set; }
    public string? Category { get; set; }
}
