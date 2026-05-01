namespace Domain.Entities;

public enum PractitionerPosition
{
    CareNavigator,
    SupportingClinician,
    Nurse,
    Physician,
    Admin,
    SocialWorker,
    Chaplain
}

public class Practitioner
{
    public Guid PractitionerId { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }          // Links to the system user account
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PrcLicenseNumber { get; set; }
    public string? NpiNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public PractitionerPosition Position { get; set; } = PractitionerPosition.CareNavigator;

    // Computed — used by GraphQL
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    // Geospatial Coordinates (Clinician Base)
    public double? BaseLatitude { get; set; }
    public double? BaseLongitude { get; set; }

    // Navigation Properties
    public ICollection<PractitionerLicensure> Licensures { get; set; } = new List<PractitionerLicensure>();
    public ICollection<PractitionerServiceArea> ServiceAreas { get; set; } = new List<PractitionerServiceArea>();
}
