using Application.Common.Dtos;
using Application.Common.Interfaces;
using Domain.Common;
using HotChocolate.Authorization;
using Infrastructure.Data;
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
        [Service] ApplicationDbContext dbContext,
        [Service] ICurrentUserService currentUserService,
        CancellationToken cancellationToken = default
    )
    {
        var currentUserId = currentUserService.UserId;
        var isSuperAdmin =
            currentUserId != null
            && await dbContext
                .UserRoles.AsNoTracking()
                .Join(
                    dbContext.Roles.AsNoTracking(),
                    ur => ur.RoleId,
                    r => r.Id,
                    (ur, r) => new { ur.UserId, r.Name }
                )
                .AnyAsync(x => x.UserId == currentUserId && x.Name == Roles.Admin, cancellationToken);

        var query = dbContext.Users.AsNoTracking();

        if (!isSuperAdmin)
        {
            var tenantId = currentUserService.TenantId;
            query = query.Where(u => u.TenantId == tenantId);
        }

        var users = await query
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.TenantId,
                u.EmergencyAccessExpiry
            })
            .ToListAsync(cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();
        var rolePairs = await dbContext
            .UserRoles.AsNoTracking()
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(
                dbContext.Roles.AsNoTracking(),
                ur => ur.RoleId,
                r => r.Id,
                (ur, r) => new { ur.UserId, RoleName = r.Name ?? string.Empty }
            )
            .ToListAsync(cancellationToken);

        var rolesByUser = rolePairs
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.RoleName).ToList());

        return users
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email ?? string.Empty,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Roles = rolesByUser.TryGetValue(u.Id, out var rList) ? rList : new List<string>(),
                TenantId = u.TenantId,
                EmergencyAccessExpiry = u.EmergencyAccessExpiry
            })
            .ToList();
    }

    [Authorize(Policy = "CanManageSetup")]
    public async Task<List<RoleDto>> GetRoles(
        [Service] ApplicationDbContext dbContext,
        CancellationToken cancellationToken = default
    )
    {
        var roles = await dbContext
            .Roles.AsNoTracking()
            .Select(r => new { r.Id, r.Name })
            .ToListAsync(cancellationToken);

        var claims = await dbContext
            .RoleClaims.AsNoTracking()
            .Where(c => c.ClaimType == "permission" && c.ClaimValue != null)
            .Select(c => new { c.RoleId, Value = c.ClaimValue! })
            .ToListAsync(cancellationToken);

        var permissionsByRole = claims
            .GroupBy(c => c.RoleId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Value).Distinct().ToList());

        return roles
            .Select(role => new RoleDto
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                Permissions = permissionsByRole.TryGetValue(role.Id, out var perms)
                    ? perms
                    : new List<string>(),
            })
            .ToList();
    }

    [Authorize(Policy = "CanManageSetup")]
    [UseOffsetPaging(DefaultPageSize = 50)]
    [UseFiltering]
    [UseSorting]
    public IQueryable<SecurityAuditLogDto> GetSecurityAuditLogs(
        [Service] IApplicationDbContext context
    )
    {
        return context.SecurityAuditLogs.AsNoTracking().ProjectToType<SecurityAuditLogDto>();
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
