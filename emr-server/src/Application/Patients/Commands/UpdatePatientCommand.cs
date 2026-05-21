using MediatR;

namespace Application.Patients.Commands;

public record UpdatePatientCommand : IRequest<bool>
{
    public Guid PatientId { get; init; }
    public string? CivilStatus { get; init; }
    public string? Religion { get; init; }
    public string? Occupation { get; init; }
    public string? Language { get; init; }
    public string? Nationality { get; init; }
    public string? BiologicalSex { get; init; }
    public string? GenderIdentity { get; init; }

    // Communications
    public List<PhoneDto>? Phones { get; init; }
    public List<EmailDto>? Emails { get; init; }
    public string? PrimaryPhone { get; init; }
    public string? PrimaryEmail { get; init; }

    // Primary Address
    public string? Street { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? PostalCode { get; init; }
    public string? Region { get; init; }
    public string? Country { get; init; }
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
}

public record PhoneDto
{
    public string PhoneNumber { get; init; } = string.Empty;
    public string Type { get; init; } = "Mobile";
    public bool IsPrimary { get; init; }
}

public record EmailDto
{
    public string EmailAddress { get; init; } = string.Empty;
    public string Type { get; init; } = "Home";
    public bool IsPrimary { get; init; }
}
