using Domain.Entities;

namespace Application.Clinical.Queries;

public record PatientClinicalSummaryDto
{
    public Guid PatientId { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Mrn { get; init; } = string.Empty;
    public int Age { get; init; }
    public string Gender { get; init; } = string.Empty;
    
    public List<ActiveMedicationDto> ActiveMedications { get; init; } = new();
    public List<RecentVitalDto> RecentVitals { get; init; } = new();
    public List<ActiveProblemDto> ActiveProblems { get; init; } = new();
    public List<AllergyDto> Allergies { get; init; } = new();
}

public record ActiveMedicationDto(string Name, string Dose, string Frequency, string Route, string Indications);
public record RecentVitalDto(string Type, string Value, string Unit, DateTimeOffset RecordedAt);
public record ActiveProblemDto(string Code, string Description, DateTimeOffset OnsetDate);
public record AllergyDto(string Substance, string Reaction, string Severity);
