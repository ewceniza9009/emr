namespace Domain.Entities;

using Domain.Enums;

public class Patient
{
    public Guid PatientId { get; set; } = Guid.NewGuid();
    public string? ExternalId { get; set; } // For Elation/CareSource Mapping
    public string Mrn { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime Dob { get; set; }
    public string BiologicalSex { get; set; } = string.Empty;
    public string? GenderIdentity { get; set; }
    public string? PhilhealthNumber { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public Guid? HealthPlanId { get; set; }
    public Guid? FacilityId { get; set; }
    public CommunicationAbility? CommunicationStatus { get; set; }
    public TechAccessLevel? TechAccess { get; set; }
    public string? BarriersToCare { get; set; }
    
    // Geospatial Coordinates (Patient Bedside)
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public HealthPlan? HealthPlan { get; set; }
    public Facility? Facility { get; set; }
    public ICollection<AdvanceDirective> AdvanceDirectives { get; set; } = new List<AdvanceDirective>();

    // Navigation Properties
    public ICollection<PatientPhone> Phones { get; set; } = new List<PatientPhone>();
    public ICollection<PatientEmail> Emails { get; set; } = new List<PatientEmail>();
    public ICollection<PatientContact> Contacts { get; set; } = new List<PatientContact>();
}
