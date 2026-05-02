using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

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

public class Facility : BaseEntity
{
    public Guid FacilityId { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public FacilityType Type { get; set; }
    public Address FacilityAddress { get; set; } = new Address();
    

    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    
    public ICollection<Patient> Residents { get; set; } = new List<Patient>();
}
