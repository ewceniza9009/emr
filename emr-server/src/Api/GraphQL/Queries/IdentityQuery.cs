using Application.Common.Dtos;
using Application.Common.Interfaces;
using Domain.Common;
using HotChocolate.Authorization;
using Infrastructure.Identity;
using Mapster;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class IdentityQuery
{
    [Authorize(Policy = "CanManageSetup")]
    public async Task<List<UserDto>> GetUsers(
        [Service] UserManager<ApplicationUser> userManager,
        [Service] RoleManager<IdentityRole> roleManager,
        [Service] ICurrentUserService currentUserService
    )
    {
        var isAdmin =
            currentUserService.UserId != null
            && (await userManager.FindByIdAsync(currentUserService.UserId))?.TenantId == null; // Or check role

        // Let's use a simpler check: If they are in the Admin role, they see all.
        var user = await userManager.FindByIdAsync(currentUserService.UserId!);
        var roles = await userManager.GetRolesAsync(user!);
        var isSuperAdmin = roles.Contains(Roles.Admin);

        var query = userManager.Users.AsQueryable();

        if (!isSuperAdmin)
        {
            var tenantId = currentUserService.TenantId;
            query = query.Where(u => u.TenantId == tenantId);
        }

        var users = await query.ToListAsync();
        var userDtos = new List<UserDto>();

        foreach (var u in users)
        {
            var userRoles = await userManager.GetRolesAsync(u);
            userDtos.Add(
                new UserDto
                {
                    Id = u.Id,
                    Email = u.Email!,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Roles = userRoles.ToList(),
                    TenantId = u.TenantId,
                    EmergencyAccessExpiry = u.EmergencyAccessExpiry
                }
            );
        }

        return userDtos;
    }

    [Authorize(Policy = "CanManageSetup")]
    public async Task<List<RoleDto>> GetRoles([Service] RoleManager<IdentityRole> roleManager)
    {
        var roles = await roleManager.Roles.ToListAsync();
        var roleDtos = new List<RoleDto>();

        foreach (var role in roles)
        {
            var claims = await roleManager.GetClaimsAsync(role);
            roleDtos.Add(
                new RoleDto
                {
                    Id = role.Id,
                    Name = role.Name!,
                    Permissions = claims
                        .Where(c => c.Type == "permission")
                        .Select(c => c.Value)
                        .ToList(),
                }
            );
        }

        return roleDtos;
    }

    [Authorize(Policy = "CanManageSetup")]
    [UseOffsetPaging(DefaultPageSize = 50)]
    [UseFiltering]
    [UseSorting]
    public IQueryable<SecurityAuditLogDto> GetSecurityAuditLogs(
        [Service] IApplicationDbContext context
    )
    {
        return context.SecurityAuditLogs.AsNoTracking().OrderByDescending(x => x.CreatedAt).ProjectToType<SecurityAuditLogDto>();
    }
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public Guid? TenantId { get; set; }
    public DateTimeOffset? EmergencyAccessExpiry { get; set; }
}

public class RoleDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
}
