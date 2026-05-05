using System.ComponentModel.DataAnnotations;
using Domain.Common;

namespace Domain.Entities;

public class SmartPhrase : BaseEntity
{
    [Key]
    public Guid PhraseId { get; set; } = Guid.NewGuid();
    public string Shortcut { get; set; } = string.Empty; // e.g. "/soap"
    public string Label { get; set; } = string.Empty;    // e.g. "SOAP Note Template"
    public string TemplateText { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public bool IsActive { get; set; } = true;
}
