using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration
    )
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        Console.WriteLine($"[AUTH] Login attempt for: {request.Email}");
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
        {
            Console.WriteLine($"[AUTH] User NOT found: {request.Email}");
            return Unauthorized();
        }

        var result = await _userManager.CheckPasswordAsync(user, request.Password);
        if (result)
        {
            Console.WriteLine($"[AUTH] Login SUCCESS: {request.Email}");
            var userRoles = await _userManager.GetRolesAsync(user);

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Email!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("userId", user.Id),
            };

            if (user.PractitionerId.HasValue)
            {
                authClaims.Add(new Claim("practitionerId", user.PractitionerId.Value.ToString()));
            }

            if (user.TenantId.HasValue)
            {
                authClaims.Add(new Claim("tenantId", user.TenantId.Value.ToString()));
            }

            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));

                // Inherit permissions from roles
                var role = await _roleManager.FindByNameAsync(userRole);
                if (role != null)
                {
                    var roleClaims = await _roleManager.GetClaimsAsync(role);
                    foreach (var claim in roleClaims.Where(c => c.Type == "permission"))
                    {
                        if (!authClaims.Any(c => c.Type == "permission" && c.Value == claim.Value))
                        {
                            authClaims.Add(new Claim("permission", claim.Value));
                        }
                    }
                }
            }

            // Check for Break-Glass / Emergency Access
            if (
                user.EmergencyAccessExpiry.HasValue
                && user.EmergencyAccessExpiry.Value > DateTimeOffset.UtcNow
            )
            {
                authClaims.Add(new Claim("emergency_access", "true"));
                authClaims.Add(new Claim("permission", "patients:view"));
                authClaims.Add(new Claim("permission", "clinical:view"));
                authClaims.Add(new Claim("permission", "clinical:chart"));
            }

            var authSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _configuration["Jwt:Key"] ?? "SUPER_SECRET_KEY_FOR_DEVELOPMENT_ONLY_123!"
                )
            );

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(
                    authSigningKey,
                    SecurityAlgorithms.HmacSha256
                )
            );

            return Ok(
                new
                {
                    token = new JwtSecurityTokenHandler().WriteToken(token),
                    expiration = token.ValidTo,
                    user = new
                    {
                        Id = user.Id,
                        user.FirstName,
                        user.LastName,
                        user.Email,
                        roles = userRoles,
                        permissions = authClaims
                            .Where(c => c.Type == "permission")
                            .Select(c => c.Value)
                            .ToList(),
                        practitionerId = user.PractitionerId,
                        tenantId = user.TenantId,
                        emergencyAccessActive = user.EmergencyAccessExpiry.HasValue
                            && user.EmergencyAccessExpiry.Value > DateTimeOffset.UtcNow,
                    },
                }
            );
        }
        return Unauthorized();
    }
}

public record LoginRequest(string Email, string Password);
