namespace Domain.Entities;

using Domain.Enums;

public class AdvanceDirective
{
    public Guid AdvanceDirectiveId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public DirectiveType Type { get; set; }
    public string? DocumentUrl { get; set; } // Link to scanned document
    public DateTimeOffset EffectiveDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    
    public Patient Patient { get; set; } = null!;
}

public class Facility
{
    public Guid FacilityId { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public FacilityType Type { get; set; }
    public string? Address { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    
    // Geospatial Coordinates
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    public ICollection<Patient> Residents { get; set; } = new List<Patient>();
}
