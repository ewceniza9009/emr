namespace Application.Common.Dtos;

public class PatientSummaryDto
{
    public Guid PatientId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Mrn { get; set; } = string.Empty;
    public ICollection<EntityAddressDto> Addresses { get; set; } = new List<EntityAddressDto>();
}
