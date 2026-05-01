using Domain.Enums;

namespace Domain.Entities;

public class ScheduleBlock
{
    public Guid BlockId { get; set; } = Guid.NewGuid();
    public Guid PractitionerId { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public ScheduleBlockStatus Status { get; set; } = ScheduleBlockStatus.Available;

    public Practitioner Practitioner { get; set; } = null!;
    public ICollection<AppointmentResource> AppointmentResources { get; set; } = new List<AppointmentResource>();
}
