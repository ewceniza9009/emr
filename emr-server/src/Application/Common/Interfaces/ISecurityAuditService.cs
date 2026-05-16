namespace Application.Common.Interfaces;

public interface ISecurityAuditService
{
    Task LogActionAsync(
        string action,
        string details,
        string? targetUserId = null,
        string? targetName = null,
        string? recordDescription = null
    );
}
