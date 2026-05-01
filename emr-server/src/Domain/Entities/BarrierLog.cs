namespace Domain.Entities;

public class BarrierLog
{
    public Guid BarrierId { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public string BarrierCategory { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public CareNavigationCase CareNavigationCase { get; set; } = null!;
}
