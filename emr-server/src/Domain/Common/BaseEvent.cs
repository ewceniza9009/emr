using MediatR;

namespace Domain.Common;

public abstract class BaseEvent : INotification
{
    public DateTimeOffset DateOccurred { get; protected set; } = DateTimeOffset.UtcNow;
}
