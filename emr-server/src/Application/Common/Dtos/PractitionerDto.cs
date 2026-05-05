namespace Application.Common.Dtos;

public class PractitionerDto
{
    public Guid PractitionerId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PrcLicenseNumber { get; set; }
    public bool IsActive { get; set; }
    public string Position { get; set; } = string.Empty;
}
