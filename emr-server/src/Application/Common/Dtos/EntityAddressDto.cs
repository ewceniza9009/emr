using Domain.Enums;

namespace Application.Common.Dtos;

public class EntityAddressDto
{
    public AddressType Type { get; set; }
    public bool IsPrimary { get; set; }
    public AddressDto Address { get; set; } = new AddressDto();
}
