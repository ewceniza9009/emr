using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    // Custom properties for Palliative Care
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    // Links this Identity User to the Practitioner domain entity if applicable
    public Guid? PractitionerId { get; set; }
}
