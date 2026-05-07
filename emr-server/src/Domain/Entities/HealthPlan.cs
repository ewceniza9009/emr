using Domain.Common;

namespace Domain.Entities;

public class HealthPlan : BaseEntity, ITenantEntity
{
    public Guid HealthPlanId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty; // e.g., PhilHealth, Maxicare
    public string? Code { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    
    public ICollection<Patient> EnrolledPatients { get; set; } = new List<Patient>();
}
