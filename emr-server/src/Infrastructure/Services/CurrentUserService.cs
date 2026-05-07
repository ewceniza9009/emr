using System.Security.Claims;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirstValue("userId");

    public Guid? PractitionerId
    {
        get
        {
            var id = _httpContextAccessor.HttpContext?.User?.FindFirstValue("practitionerId");
            return Guid.TryParse(id, out var guid) ? guid : null;
        }
    }

    public Guid? TenantId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var id = user?.FindFirstValue("tenantId") ?? user?.FindFirstValue(ClaimTypes.UserData);
            
            if (Guid.TryParse(id, out var guid))
            {
                return guid;
            }

            // Fallback: Check if the tenantId is stored under a different claim type name
            var alternativeId = user?.Claims.FirstOrDefault(c => c.Type.Equals("tenantId", StringComparison.OrdinalIgnoreCase))?.Value;
            return Guid.TryParse(alternativeId, out var altGuid) ? altGuid : null;
        }
    }
}
