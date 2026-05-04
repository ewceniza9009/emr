namespace Application.Appointments.Dtos;

public class AvailableProviderDto
{
    public Guid PractitionerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Role { get; set; } // e.g. "CareNavigator", "Nurse"
    public string? Position { get; set; } // Display label

    // Real-time Geospatial Data
    public double DistanceInMiles { get; set; }
    public double TravelTimeInMinutes { get; set; }

    // Availability Window
    public DateTimeOffset ShiftStart { get; set; }
    public DateTimeOffset ShiftEnd { get; set; }
}
