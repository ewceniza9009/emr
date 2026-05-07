namespace Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    Guid? PractitionerId { get; }
    Guid? TenantId { get; }
}
