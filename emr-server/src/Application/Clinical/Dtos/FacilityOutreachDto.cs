namespace Application.Clinical.Dtos;

public class FacilityOutreachDto
{
    public Guid FacilityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int PatientCount { get; set; }
    public int CrisisCount { get; set; }
}
