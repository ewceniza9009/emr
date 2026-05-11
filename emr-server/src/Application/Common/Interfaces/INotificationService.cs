using Domain.Entities;
using Domain.Enums;

namespace Application.Common.Interfaces;

public interface INotificationService
{
    Task SendGlobalNotificationAsync(string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? category = null, string? actionUrl = null);
    Task SendUserNotificationAsync(string userId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? category = null, string? actionUrl = null);
    Task<List<Notification>> GetUserNotificationsAsync(string userId, int count = 20);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(string userId);
    Task<int> GetUnreadCountAsync(string userId);
}
