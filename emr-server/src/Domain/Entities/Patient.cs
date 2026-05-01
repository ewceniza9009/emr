namespace Domain.Entities;

public class Patient
{
    public Guid PatientId { get; set; } = Guid.NewGuid();
    public string Mrn { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime Dob { get; set; }
    public string BiologicalSex { get; set; } = string.Empty;
    public string? GenderIdentity { get; set; }
    public string? PhilhealthNumber { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    // public ICollection<Encounter> Encounters { get; set; } = new List<Encounter>();
    // public ICollection<CarePlan> CarePlans { get; set; } = new List<CarePlan>();
}
