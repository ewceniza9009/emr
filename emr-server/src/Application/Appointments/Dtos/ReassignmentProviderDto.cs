namespace Application.Appointments.Dtos;

public class ReassignmentProviderDto
{
    public Guid PractitionerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double? TravelTimeMinutes { get; set; }
    public double? DistanceInMiles { get; set; }
    public bool IsCareNavigator { get; set; }
    public bool IsSupportingClinician { get; set; }
    public string? Position { get; set; }
}
