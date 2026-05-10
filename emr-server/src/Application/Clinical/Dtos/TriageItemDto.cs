using System;

namespace Application.Clinical.Dtos;

public class TriageItemDto
{
    public Guid PatientId { get; set; }
    public string Mrn { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int LatestPainScore { get; set; }
    public int LatestWellbeingScore { get; set; }
    public string AdvanceDirectiveType { get; set; } = string.Empty;
    public bool IsAlert { get; set; }
    public string? TriageNote { get; set; }
}
