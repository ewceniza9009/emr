namespace Domain.Entities;

public class AppointmentResource
{
    public Guid AppointmentId { get; set; }
    public Guid BlockId { get; set; }

    public Appointment Appointment { get; set; } = null!;
    public ScheduleBlock ScheduleBlock { get; set; } = null!;
}
