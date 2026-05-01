namespace Domain.Entities;

public class PractitionerServiceArea
{
    public Guid ServiceAreaId { get; set; } = Guid.NewGuid();
    public Guid PractitionerId { get; set; }
    public string ZipCode { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;

    public Practitioner Practitioner { get; set; } = null!;
}
