using Application.Common.Interfaces;
using Domain.Entities;
using HotChocolate.Authorization;

namespace Api.GraphQL.Queries;

[ExtendObjectType(typeof(Query))]
public class NotificationQuery
{
    [Authorize]
    public async Task<List<Notification>> GetNotifications(
        [Service] INotificationService notificationService,
        [Service] ICurrentUserService currentUserService,
        int count = 20)
    {
        var userId = currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return new List<Notification>();
        
        return await notificationService.GetUserNotificationsAsync(userId, count);
    }

    [Authorize]
    public async Task<int> GetUnreadNotificationCount(
        [Service] INotificationService notificationService,
        [Service] ICurrentUserService currentUserService)
    {
        var userId = currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return 0;
        
        return await notificationService.GetUnreadCountAsync(userId);
    }
}
