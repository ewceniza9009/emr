namespace Domain.Entities;

public class ProviderShift
{
    public Guid ProviderShiftId { get; set; } = Guid.NewGuid();
    public Guid PractitionerId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsActive { get; set; } = true;

    public Practitioner Practitioner { get; set; } = null!;
}

public class ProviderDistance
{
    public Guid ProviderId { get; set; }
    public double DistanceInMiles { get; set; }
    public double TravelTimeInMinutes { get; set; }
    public DateTimeOffset? FromTime { get; set; }
}
