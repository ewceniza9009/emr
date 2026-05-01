using Domain.Enums;

namespace Domain.Entities;

public class Appointment
{
    public Guid AppointmentId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public VisitType VisitType { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset ScheduledStart { get; set; }
    public DateTimeOffset ScheduledEnd { get; set; }
    public AppointmentModality Modality { get; set; } = AppointmentModality.InPersonFacility;
    public string? MeetingLink { get; set; }
    public Guid? PractitionerId { get; set; }

    public Patient Patient { get; set; } = null!;
    public Practitioner? Practitioner { get; set; }
    public ICollection<AppointmentResource> AppointmentResources { get; set; } = new List<AppointmentResource>();
}
