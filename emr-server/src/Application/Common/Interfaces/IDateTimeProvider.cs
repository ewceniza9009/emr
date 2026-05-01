namespace Application.Common.Interfaces;

public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
    
    // Converts a stored UTC time into the specific client's local time zone
    DateTimeOffset ConvertToClientTime(DateTimeOffset utcDateTime, string clientTimeZoneId);
    
    // Safely converts a raw local time provided by the client into absolute UTC
    DateTimeOffset ConvertToUtc(DateTime clientDateTime, string clientTimeZoneId);
}
