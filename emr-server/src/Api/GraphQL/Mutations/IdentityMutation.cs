using System.Security.Claims;
using Application.Common.Interfaces;
using HotChocolate.Authorization;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanManageSetup")]
public class IdentityMutation
{
    public async Task<bool> AssignRoleToUser(
        string userId,
        string roleName,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] ICurrentUserService currentUserService,
        [Service] ISecurityAuditService auditService
    )
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        var currentUser = await userManager.FindByIdAsync(currentUserService.UserId!);
        var currentUserRoles = await userManager.GetRolesAsync(currentUser!);
        var isSuperAdmin = currentUserRoles.Contains("Admin");

        if (!isSuperAdmin && user.TenantId != currentUserService.TenantId)
            return false;

        var result = await userManager.AddToRoleAsync(user, roleName);
        if (result.Succeeded)
        {
            await auditService.LogActionAsync(
                "ROLE_ASSIGNED",
                $"Assigned role '{roleName}' to user.",
                user.Id,
                $"{user.FirstName} {user.LastName}"
            );
        }
        return result.Succeeded;
    }

    public async Task<bool> RemoveRoleFromUser(
        string userId,
        string roleName,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] ICurrentUserService currentUserService,
        [Service] ISecurityAuditService auditService
    )
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        var currentUser = await userManager.FindByIdAsync(currentUserService.UserId!);
        var currentUserRoles = await userManager.GetRolesAsync(currentUser!);
        var isSuperAdmin = currentUserRoles.Contains("Admin");

        if (!isSuperAdmin && user.TenantId != currentUserService.TenantId)
            return false;

        var result = await userManager.RemoveFromRoleAsync(user, roleName);
        if (result.Succeeded)
        {
            await auditService.LogActionAsync(
                "ROLE_REMOVED",
                $"Removed role '{roleName}' from user.",
                user.Id,
                $"{user.FirstName} {user.LastName}"
            );
        }
        return result.Succeeded;
    }

    public async Task<bool> UpdateRolePermissions(
        string roleName,
        List<string> permissions,
        [Service] RoleManager<IdentityRole> roleManager,
        [Service] ISecurityAuditService auditService
    )
    {
        var role = await roleManager.FindByNameAsync(roleName);
        if (role == null)
            return false;

        var existingClaims = await roleManager.GetClaimsAsync(role);

        // Remove old permission claims
        foreach (var claim in existingClaims.Where(c => c.Type == "permission"))
        {
            await roleManager.RemoveClaimAsync(role, claim);
        }

        // Add new permission claims
        foreach (var permission in permissions)
        {
            await roleManager.AddClaimAsync(role, new Claim("permission", permission));
        }

        await auditService.LogActionAsync(
            "PERMISSIONS_UPDATED",
            $"Updated permissions for role '{roleName}'. New set: {string.Join(", ", permissions)}",
            role.Id,
            role.Name
        );

        return true;
    }

    public async Task<bool> ActivateBreakGlass(
        string justification,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] ICurrentUserService currentUserService,
        [Service] ISecurityAuditService auditService
    )
    {
        var userId = currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
            return false;

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        // Grant access for 4 hours
        user.EmergencyAccessExpiry = DateTimeOffset.UtcNow.AddHours(4);
        var result = await userManager.UpdateAsync(user);

        if (result.Succeeded)
        {
            await auditService.LogActionAsync(
                "EMERGENCY_ACCESS_ACTIVATED",
                $"User activated Break-Glass protocol. Justification: {justification}",
                user.Id,
                $"{user.FirstName} {user.LastName}"
            );
        }

        return result.Succeeded;
    }
}
