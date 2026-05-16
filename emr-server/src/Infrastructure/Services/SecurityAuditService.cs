using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Services;

public class SecurityAuditService : ISecurityAuditService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly INotificationService _notificationService;

    public SecurityAuditService(
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor,
        IServiceScopeFactory scopeFactory,
        INotificationService notificationService
    )
    {
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
        _scopeFactory = scopeFactory;
        _notificationService = notificationService;
    }

    public async Task LogActionAsync(
        string action,
        string details,
        string? targetUserId = null,
        string? targetName = null,
        string? recordDescription = null
    )
    {
        var userId = _currentUserService.UserId;
        var userName = "System";

        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        if (!string.IsNullOrEmpty(userId))
        {
            try
            {
                var userManager = scope.ServiceProvider.GetRequiredService<
                    UserManager<ApplicationUser>
                >();
                var user = await userManager.FindByIdAsync(userId);
                userName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown";
            }
            catch
            {
                userName = "System/Auth-Error";
            }
        }

        var log = new SecurityAuditLog
        {
            SecurityAuditLogId = Guid.NewGuid(),
            Action = action,
            ActorUserId = userId ?? "SYSTEM",
            ActorName = userName,
            TargetUserId = targetUserId,
            TargetName = targetName,
            Details = details,
            RecordDescription = recordDescription,
            IpAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString(),
            UserAgent = _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"].ToString(),
            TenantId = _currentUserService.TenantId ?? Guid.Empty,
        };

        context.SecurityAuditLogs.Add(log);
        await context.SaveChangesAsync(CancellationToken.None);

        if (action.Contains("BREAK GLASS", StringComparison.OrdinalIgnoreCase))
        {
            await _notificationService.SendGlobalNotificationAsync(
                "SECURITY ALERT: BREAK GLASS",
                $"{userName} accessed restricted data for {targetName ?? "unknown patient"}.",
                Domain.Enums.NotificationPriority.Critical,
                category: "Security",
                actionUrl: "/admin/audit-logs"
            );
        }
    }
}
