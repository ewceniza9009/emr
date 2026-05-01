namespace Domain.Entities;

public class Practitioner
{
    public Guid PractitionerId { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PrcLicenseNumber { get; set; }
    public string? NpiNumber { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    // public ICollection<Encounter> Encounters { get; set; } = new List<Encounter>();
}
