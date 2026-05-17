using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly IApplicationDbContext _context;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        IApplicationDbContext context
    )
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _context = context;
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

    [HttpPost("magic-login")]
    public async Task<IActionResult> MagicLogin([FromBody] MagicLoginRequest request)
    {
        Console.WriteLine($"[AUTH] Magic Login attempt with token: {request.Token}");

        // Find the patient. We prioritize looking up the patient by MRN if the token contains one
        // (e.g., "DEMO_MAGIC_MRN-99999" or just "MRN-99999"). Otherwise we find the seeded patient "Pearline" (MRN-99999).
        string mrn = "MRN-99999";
        if (!string.IsNullOrEmpty(request.Token))
        {
            if (request.Token.StartsWith("DEMO_MAGIC_"))
            {
                var parts = request.Token.Split('_');
                if (parts.Length > 2) mrn = parts[2];
            }
            else if (request.Token.StartsWith("MRN-"))
            {
                mrn = request.Token;
            }
        }

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Mrn == mrn);

        if (patient == null)
        {
            // Fallback: get first available patient
            patient = await _context.Patients.FirstOrDefaultAsync();
        }

        if (patient == null)
        {
            Console.WriteLine("[AUTH] No patients found in database for Magic Login.");
            return NotFound("No patients found in database.");
        }

        // Get or create the user for this patient
        var userEmail = $"{patient.FirstName.ToLower().Replace(" ", "")}.{patient.LastName.ToLower().Replace(" ", "")}@patient.emr";
        var user = await _userManager.FindByEmailAsync(userEmail);

        if (user == null)
        {
            Console.WriteLine($"[AUTH] User not found for patient, creating new user: {userEmail}");
            user = new ApplicationUser
            {
                Id = Guid.NewGuid().ToString(),
                UserName = userEmail,
                Email = userEmail,
                FirstName = patient.FirstName,
                LastName = patient.LastName,
                EmailConfirmed = true,
                TenantId = patient.TenantId
            };

            var createResult = await _userManager.CreateAsync(user, "PatientPassword@123!");
            if (!createResult.Succeeded)
            {
                Console.WriteLine($"[AUTH] Failed to create user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                return StatusCode(500, "Failed to create user account.");
            }
            
            // Add Role "Patient"
            if (!await _roleManager.RoleExistsAsync("Patient"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Patient"));
            }
            await _userManager.AddToRoleAsync(user, "Patient");
        }

        // Get or create the PatientAccount
        var patientAccount = await _context.PatientAccounts
            .FirstOrDefaultAsync(pa => pa.PatientId == patient.PatientId);

        if (patientAccount == null)
        {
            Console.WriteLine($"[AUTH] PatientAccount not found, creating one for patient: {patient.PatientId}");
            patientAccount = new PatientAccount
            {
                PatientAccountId = Guid.NewGuid(),
                TenantId = patient.TenantId,
                PatientId = patient.PatientId,
                UserId = Guid.Parse(user.Id),
                IsActive = true
            };
            _context.PatientAccounts.Add(patientAccount);
            await _context.SaveChangesAsync(default);
        }

        // Generate JWT Token
        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("userId", user.Id),
            new Claim("patientId", patient.PatientId.ToString()),
            new Claim("patientAccountId", patientAccount.PatientAccountId.ToString()),
            new Claim("tenantId", patient.TenantId.ToString()),
            new Claim(ClaimTypes.Role, "Patient")
        };

        var authSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"] ?? "SUPER_SECRET_KEY_FOR_DEVELOPMENT_ONLY_123!"
            )
        );

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: DateTime.Now.AddDays(30), // Longer expiry for demo ease
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
                    roles = new List<string> { "Patient" },
                    permissions = new List<string> { "patient:access" },
                    patientId = patient.PatientId,
                    patientAccountId = patientAccount.PatientAccountId,
                    tenantId = user.TenantId
                }
            }
        );
    }
}

public record LoginRequest(string Email, string Password);
public record MagicLoginRequest(string Token);

