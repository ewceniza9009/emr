using Domain.Common;

namespace Domain.Entities;

public class SdohAssessment : BaseEntity, ITenantEntity
{
    public Guid SdohId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid CaseId { get; set; }
    public Guid AssessorId { get; set; }
    public bool FoodInsecurity { get; set; }
    public bool HousingInstability { get; set; }
    public bool TransportationBarrier { get; set; }
    public bool FinancialToxicity { get; set; }
    public DateTimeOffset AssessedAt { get; set; } = DateTimeOffset.UtcNow;

    public CareNavigationCase CareNavigationCase { get; set; } = null!;
    public Practitioner Assessor { get; set; } = null!;
}
