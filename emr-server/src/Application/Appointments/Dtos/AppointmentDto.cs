using Application.Clinical.Dtos;
using Application.Common.Dtos;
using Application.Patients.Dtos;
using Domain.Enums;

namespace Application.Appointments.Dtos;

public class AppointmentDto
{
    public Guid AppointmentId { get; set; }
    public Guid PatientId { get; set; }
    public VisitType VisitType { get; set; }
    public AppointmentStatus Status { get; set; }
    public DateTimeOffset ScheduledStart { get; set; }
    public DateTimeOffset ScheduledEnd { get; set; }
    public AppointmentModality Modality { get; set; }
    public string? MeetingLink { get; set; }
    public Guid? PractitionerId { get; set; }
    public PatientSummaryDto? Patient { get; set; }
    public PractitionerDto? Practitioner { get; set; }
    public ICollection<ClinicalEncounterDto> Encounters { get; set; } = new List<ClinicalEncounterDto>();
    public ICollection<PractitionerDto> SupportingClinicians { get; set; } = new List<PractitionerDto>();
    
    // Logistics & Clinical HUD fields
    public double? TravelTimeMinutes { get; set; }
    public double? DistanceInMiles { get; set; }
    public ICollection<AssessmentType> PlannedAssessments { get; set; } = new List<AssessmentType>();
}
