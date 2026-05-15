using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common.Interfaces;
using Domain.Entities;
using HotChocolate.Authorization;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class IdentityMutation
{
    [Authorize(Policy = "CanManageSetup")]
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

    [Authorize(Policy = "CanManageSetup")]
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

    [Authorize(Policy = "CanManageSetup")]
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

    [Authorize(Policy = "CanManageSetup")]
    public async Task<bool> CreateRole(
        string roleName,
        [Service] RoleManager<IdentityRole> roleManager,
        [Service] ISecurityAuditService auditService
    )
    {
        if (await roleManager.RoleExistsAsync(roleName))
            return false;

        var result = await roleManager.CreateAsync(new IdentityRole(roleName));
        if (result.Succeeded)
        {
            await auditService.LogActionAsync(
                "ROLE_CREATED",
                $"Created new security role: '{roleName}'",
                "SYSTEM",
                roleName
            );
        }
        return result.Succeeded;
    }

    [Authorize(Policy = "CanManageSetup")]
    public async Task<bool> DeleteRole(
        string roleName,
        [Service] RoleManager<IdentityRole> roleManager,
        [Service] ISecurityAuditService auditService
    )
    {
        var role = await roleManager.FindByNameAsync(roleName);
        if (role == null)
            return false;

        // Prevent deleting core roles
        if (roleName.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return false;

        var result = await roleManager.DeleteAsync(role);
        if (result.Succeeded)
        {
            await auditService.LogActionAsync(
                "ROLE_DELETED",
                $"Deleted security role: '{roleName}'",
                role.Id,
                roleName
            );
        }
        return result.Succeeded;
    }

    [Authorize(Policy = "CanManageSetup")]
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

    [Authorize(Policy = "CanManageSetup")]
    public async Task<string?> InvitePractitioner(
        Guid practitionerId,
        string email,
        [Service] IApplicationDbContext context,
        [Service] IConfiguration configuration,
        [Service] ISecurityAuditService auditService
    )
    {
        var practitioner = await context.Practitioners
            .FirstOrDefaultAsync(p => p.PractitionerId == practitionerId);

        if (practitioner == null) return null;

        // Generate a secure invitation token (JWT)
        var authSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration["Jwt:Key"] ?? "SUPER_SECRET_KEY_FOR_DEVELOPMENT_ONLY_123!")
        );

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            expires: DateTime.Now.AddDays(7),
            claims: new List<Claim>
            {
                new Claim("practitionerId", practitionerId.ToString()),
                new Claim("email", email),
                new Claim("tenantId", practitioner.TenantId.ToString()),
                new Claim("type", "invitation")
            },
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        var invitationLink = $"/onboarding?token={new JwtSecurityTokenHandler().WriteToken(token)}";

        await auditService.LogActionAsync(
            "PRACTITIONER_INVITED",
            $"Generated onboarding invitation for {practitioner.FullName} ({email})",
            practitionerId.ToString(),
            practitioner.FullName
        );

        return invitationLink;
    }

    [AllowAnonymous]
    public async Task<bool> CompletePractitionerOnboarding(
        string token,
        string password,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        [Service] IConfiguration configuration,
        [Service] ISecurityAuditService auditService
    )
    {
        var handler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"] ?? "SUPER_SECRET_KEY_FOR_DEVELOPMENT_ONLY_123!")),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };

        try
        {
            var principal = handler.ValidateToken(token, validationParameters, out var validatedToken);
            var practitionerId = Guid.Parse(principal.FindFirst("practitionerId")!.Value);
            var email = principal.FindFirst("email")!.Value;
            var tenantId = Guid.Parse(principal.FindFirst("tenantId")!.Value);

            var practitioner = await context.Practitioners.FirstOrDefaultAsync(p => p.PractitionerId == practitionerId);
            if (practitioner == null || (practitioner.UserId != Guid.Empty && practitioner.UserId != null)) return false;

            // Create User
            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FirstName = practitioner.FirstName,
                LastName = practitioner.LastName,
                PractitionerId = practitionerId,
                TenantId = tenantId
            };

            var result = await userManager.CreateAsync(user, password);
            if (!result.Succeeded) return false;

            // Link Practitioner to User
            practitioner.UserId = Guid.Parse(user.Id);
            await context.SaveChangesAsync(default);

            await auditService.LogActionAsync(
                "ONBOARDING_COMPLETED",
                $"Practitioner {practitioner.FullName} completed onboarding and linked user account.",
                user.Id,
                practitioner.FullName
            );

            return true;
        }
        catch
        {
            return false;
        }
    }
}
