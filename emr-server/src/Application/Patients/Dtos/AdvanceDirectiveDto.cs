using Domain.Enums;
using System;

namespace Application.Patients.Dtos;

public class AdvanceDirectiveDto
{
    public Guid AdvanceDirectiveId { get; set; }
    public DirectiveType Type { get; set; }
    public string? DocumentUrl { get; set; }
    public DateTimeOffset EffectiveDate { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
}
