using Domain.Common;

namespace Domain.Entities;

public class ProviderShift : BaseEntity, ITenantEntity
{
    public Guid ProviderShiftId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PractitionerId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsActive { get; set; } = true;

    public Practitioner Practitioner { get; set; } = null!;
}

public class ClinicalSlot
{
    public Guid PractitionerId { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public double DistanceInMiles { get; set; }
    public double TravelTimeInMinutes { get; set; }
    public double BufferTimeInMinutes { get; set; }
}
