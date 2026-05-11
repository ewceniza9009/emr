using Application.Common.Interfaces;
using HotChocolate.Authorization;

namespace Api.GraphQL.Mutations;

[ExtendObjectType(typeof(Mutation))]
public class NotificationMutation
{
    [Authorize]
    public async Task<bool> MarkNotificationAsRead(
        [Service] INotificationService notificationService,
        Guid notificationId)
    {
        await notificationService.MarkAsReadAsync(notificationId);
        return true;
    }

    [Authorize]
    public async Task<bool> MarkAllNotificationsAsRead(
        [Service] INotificationService notificationService,
        [Service] ICurrentUserService currentUserService)
    {
        var userId = currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return false;
        
        await notificationService.MarkAllAsReadAsync(userId);
        return true;
    }
}
