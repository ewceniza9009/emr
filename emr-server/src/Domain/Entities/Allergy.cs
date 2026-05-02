using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Allergy : BaseEntity
{
    public Guid AllergyId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string Allergen { get; set; } = string.Empty;
    public SeverityLevel Severity { get; set; } = SeverityLevel.Moderate;
    public string Reaction { get; set; } = string.Empty;
    public DateTimeOffset IdentifiedAt { get; set; } = DateTimeOffset.UtcNow;

    public Patient Patient { get; set; } = null!;
}
