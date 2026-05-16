using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IDbContextFactory<ApplicationDbContext> _dbSetFactory;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ICurrentUserService _currentUserService;

    public NotificationService(
        IDbContextFactory<ApplicationDbContext> dbSetFactory,
        IHubContext<NotificationHub> hubContext,
        ICurrentUserService currentUserService
    )
    {
        _dbSetFactory = dbSetFactory;
        _hubContext = hubContext;
        _currentUserService = currentUserService;
    }

    public async Task SendGlobalNotificationAsync(
        string title,
        string message,
        NotificationPriority priority = NotificationPriority.Normal,
        string? category = null,
        string? actionUrl = null
    )
    {
        var notification = new Notification
        {
            Title = title,
            Message = message,
            Priority = priority,
            CreatedAt = DateTimeOffset.UtcNow,
            IsRead = false,
            Category = category,
            ActionUrl = actionUrl,
        };

        using var context = await _dbSetFactory.CreateDbContextAsync();
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();

        // Broadcast to all connected clients if enabled
        var tenantId = _currentUserService.TenantId;
        var config = await context.TenantConfigurations.FirstOrDefaultAsync(t => t.TenantId == tenantId);
        if (config == null || config.EnableSignalR)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
        }
    }

    public async Task SendUserNotificationAsync(
        string userId,
        string title,
        string message,
        NotificationPriority priority = NotificationPriority.Normal,
        string? category = null,
        string? actionUrl = null
    )
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Priority = priority,
            CreatedAt = DateTimeOffset.UtcNow,
            IsRead = false,
            Category = category,
            ActionUrl = actionUrl,
        };

        using var context = await _dbSetFactory.CreateDbContextAsync();
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();

        // Send to specific user group if enabled
        var tenantId = _currentUserService.TenantId;
        var config = await context.TenantConfigurations.FirstOrDefaultAsync(t => t.TenantId == tenantId);
        if (config == null || config.EnableSignalR)
        {
            await _hubContext
                .Clients.Group($"User_{userId}")
                .SendAsync("ReceiveNotification", notification);
            // Also send by user id directly if SignalR is configured with UserIdProvider
            await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification", notification);
        }
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(string userId, int count = 20)
    {
        using var context = await _dbSetFactory.CreateDbContextAsync();
        return await context
            .Notifications.Where(n => n.UserId == userId || n.UserId == null)
            .OrderByDescending(n => n.Priority) // Important first as requested
            .ThenByDescending(n => n.CreatedAt)
            .Take(count)
            .ToListAsync();
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        using var context = await _dbSetFactory.CreateDbContextAsync();
        var notification = await context.Notifications.FindAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTimeOffset.UtcNow;
            await context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        using var context = await _dbSetFactory.CreateDbContextAsync();
        var unread = await context
            .Notifications.Where(n => (n.UserId == userId || n.UserId == null) && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = DateTimeOffset.UtcNow;
        }

        await context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        using var context = await _dbSetFactory.CreateDbContextAsync();
        return await context.Notifications.CountAsync(n =>
            (n.UserId == userId || n.UserId == null) && !n.IsRead
        );
    }
}
