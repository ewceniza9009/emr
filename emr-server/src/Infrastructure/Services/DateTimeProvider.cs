using Application.Common.Interfaces;

namespace Infrastructure.Services;

public class DateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;

    public DateTimeOffset ConvertToClientTime(DateTimeOffset utcDateTime, string clientTimeZoneId)
    {
        try
        {
            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(clientTimeZoneId);
            return TimeZoneInfo.ConvertTime(utcDateTime, timeZoneInfo);
        }
        catch (Exception ex)
            when (ex is TimeZoneNotFoundException || ex is InvalidTimeZoneException)
        {
            return utcDateTime;
        }
    }

    public DateTimeOffset ConvertToUtc(DateTime clientDateTime, string clientTimeZoneId)
    {
        try
        {
            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(clientTimeZoneId);
            var utcTime = TimeZoneInfo.ConvertTimeToUtc(clientDateTime, timeZoneInfo);
            return new DateTimeOffset(utcTime, TimeSpan.Zero);
        }
        catch (Exception ex)
            when (ex is TimeZoneNotFoundException || ex is InvalidTimeZoneException)
        {
            return new DateTimeOffset(clientDateTime, TimeSpan.Zero);
        }
    }
}
