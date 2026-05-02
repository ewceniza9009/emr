using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class Address
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "Philippines";

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public string ToDisplayString()
    {
        return $"{Street}, {City}, {State} {PostalCode}".Trim(',', ' ');
    }
}
