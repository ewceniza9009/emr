using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Services;

public class SecurityAuditService : ISecurityAuditService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly UserManager<ApplicationUser> _userManager;

    public SecurityAuditService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
        _userManager = userManager;
    }

    public async Task LogActionAsync(
        string action,
        string details,
        string? targetUserId = null,
        string? targetName = null)
    {
        var userId = _currentUserService.UserId;
        var userName = "System";

        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _userManager.FindByIdAsync(userId);
            userName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown";
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

        _context.SecurityAuditLogs.Add(log);
        await _context.SaveChangesAsync(CancellationToken.None);
    }
}
