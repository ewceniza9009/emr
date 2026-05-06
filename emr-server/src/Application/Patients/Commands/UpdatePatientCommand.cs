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
    public string? PrimaryPhone { get; init; }
    public string? PrimaryEmail { get; init; }
}
