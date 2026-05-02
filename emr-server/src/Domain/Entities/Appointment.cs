using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Appointment : BaseEntity
{
    public Guid AppointmentId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public VisitType VisitType { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;
    public DateTimeOffset ScheduledStart { get; set; }
    public DateTimeOffset ScheduledEnd { get; set; }
    public AppointmentModality Modality { get; set; } = AppointmentModality.InPersonFacility;
    public string? MeetingLink { get; set; }
    public Guid? PractitionerId { get; set; }

    public double? TravelTimeMinutes { get; set; }
    public double? DistanceInMiles { get; set; }

    public Patient Patient { get; set; } = null!;
    public Practitioner? Practitioner { get; set; }
    public ICollection<Practitioner> SupportingClinicians { get; set; } = new List<Practitioner>();
    public ICollection<AppointmentResource> AppointmentResources { get; set; } = new List<AppointmentResource>();
}
