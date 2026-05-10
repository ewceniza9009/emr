using Domain.Common;
namespace Domain.Entities;

public class AppointmentResource : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Guid AppointmentId { get; set; }
    public Guid BlockId { get; set; }

    public Appointment Appointment { get; set; } = null!;
    public ScheduleBlock ScheduleBlock { get; set; } = null!;
}
