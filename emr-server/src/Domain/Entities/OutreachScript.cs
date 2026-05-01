namespace Domain.Entities;

public class OutreachScript
{
    public Guid OutreachScriptId { get; set; } = Guid.NewGuid();
    public string LocationName { get; set; } = string.Empty; // e.g., Manila, Quezon City
    public string PostalCode { get; set; } = string.Empty;
    public string ScriptTitle { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty; // The actual script text
    public bool IsDefault { get; set; }
}
