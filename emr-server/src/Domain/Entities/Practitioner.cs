using Domain.Common;

namespace Domain.Entities;

public enum PractitionerPosition
{
    Nurse,
    Physician,
    Admin,
    SocialWorker,
    Chaplain
}

public class Practitioner : BaseEntity
{
    public Guid PractitionerId { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }          // Links to the system user account
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PrcLicenseNumber { get; set; }
    public string? NpiNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public PractitionerPosition Position { get; set; } = PractitionerPosition.Nurse;
    public bool IsCareNavigator { get; set; }
    public bool IsSupportingClinician { get; set; }

    // Computed — used by GraphQL
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    // Geospatial Coordinates (Clinician Base)
    // Navigation Properties
    public ICollection<EntityAddress> Addresses { get; set; } = new List<EntityAddress>();




    // Navigation Properties
    public ICollection<PractitionerLicensure> Licensures { get; set; } = new List<PractitionerLicensure>();
    public ICollection<PractitionerServiceArea> ServiceAreas { get; set; } = new List<PractitionerServiceArea>();
    public ICollection<ProviderShift> Shifts { get; set; } = new List<ProviderShift>();
}
