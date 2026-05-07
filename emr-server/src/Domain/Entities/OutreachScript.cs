using Domain.Common;
namespace Domain.Entities;

public class OutreachScript : BaseEntity, ITenantEntity
{
    public Guid OutreachScriptId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string LocationName { get; set; } = string.Empty; // e.g., Manila, Quezon City
    public string PostalCode { get; set; } = string.Empty;
    public string ScriptTitle { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty; // The actual script text
    public bool IsDefault { get; set; }
}
