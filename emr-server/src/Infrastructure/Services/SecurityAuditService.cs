using Microsoft.Extensions.DependencyInjection;
using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Services;

public class SecurityAuditService : ISecurityAuditService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IServiceScopeFactory _scopeFactory;

    public SecurityAuditService(
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor,
        IServiceScopeFactory scopeFactory)
    {
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
        _scopeFactory = scopeFactory;
    }

    public async Task LogActionAsync(
        string action,
        string details,
        string? targetUserId = null,
        string? targetName = null)
    {
        var userId = _currentUserService.UserId;
        var userName = "System";

        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        if (!string.IsNullOrEmpty(userId))
        {
            try {
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var user = await userManager.FindByIdAsync(userId);
                userName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown";
            } catch {
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
            IpAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString(),
            UserAgent = _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"].ToString(),
            TenantId = _currentUserService.TenantId ?? Guid.Empty
        };

        context.SecurityAuditLogs.Add(log);
        await context.SaveChangesAsync(CancellationToken.None);
    }
}
