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
    private readonly IMagicTokenService _magicTokenService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        IApplicationDbContext context,
        IMagicTokenService magicTokenService
    )
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _context = context;
        _magicTokenService = magicTokenService;
    }

    [HttpGet("debug-db")]
    public async Task<IActionResult> DebugDb()
    {
        var threads = await _context.CareThreads
            .IgnoreQueryFilters()
            .Select(t => new {
                t.CareThreadId,
                t.TenantId,
                t.PatientId,
                t.Subject,
                t.IsActive,
                PatientName = t.Patient != null ? t.Patient.FirstName + " " + t.Patient.LastName : "Null",
                MessageCount = t.Messages.Count
            })
            .ToListAsync();

        var messages = await _context.ChatMessages
            .IgnoreQueryFilters()
            .Select(m => new {
                m.ChatMessageId,
                m.CareThreadId,
                m.TenantId,
                m.SenderRole,
                m.Content,
                m.Timestamp
            })
            .ToListAsync();

        return Ok(new { threads, messages });
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

    [HttpPost("magic-token/generate")]
    public async Task<IActionResult> GenerateMagicToken([FromBody] GenerateMagicTokenRequest request)
    {
        Console.WriteLine($"[AUTH] Sleek Dynamic Magic Token generation for Patient: {request.PatientId}");

        var patient = await _context.Patients
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId);

        if (patient == null)
        {
            return NotFound("Patient not found.");
        }

        // Sleek Dynamic Binding Flow:
        // Use patient.DeviceSignature if already bound, otherwise use "DYNAMIC_BIND"
        string activeDeviceId = string.IsNullOrEmpty(patient.DeviceSignature) 
            ? "DYNAMIC_BIND" 
            : patient.DeviceSignature;

        // Standard mobile app base URL from environment/settings configuration
        string baseUrl = _configuration["MobilePortalUrl"] ?? "http://localhost:3672";
        string magicLink = await _magicTokenService.GenerateMagicLinkAsync(
            request.PatientId,
            request.IsCaregiver,
            activeDeviceId,
            baseUrl,
            patient.TenantId
        );

        return Ok(new { link = magicLink });
    }

    [HttpPost("magic-token/reset")]
    public async Task<IActionResult> ResetMagicTokenDevice([FromBody] ResetMagicTokenDeviceRequest request)
    {
        Console.WriteLine($"[AUTH] Resetting persistent DeviceSignature for Patient: {request.PatientId}");

        var patient = await _context.Patients
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId);

        if (patient == null)
        {
            return NotFound("Patient not found.");
        }

        patient.DeviceSignature = null;
        _context.Patients.Update(patient);
        await _context.SaveChangesAsync(default);

        return Ok(new { success = true });
    }

    [HttpPost("magic-login")]
    public async Task<IActionResult> MagicLogin([FromBody] MagicLoginRequest request)
    {
        Console.WriteLine($"[AUTH] Magic Login attempt with token: {request.Token}, deviceId: {request.DeviceId}");

        Guid patientId = Guid.Empty;
        bool isCaregiver = false;

        // Support simulated demo tokens for biometrics and local mock tests
        if (!string.IsNullOrEmpty(request.Token) && (request.Token.StartsWith("DEMO_MAGIC_") || request.Token.StartsWith("DEMO_CAREGIVER_")))
        {
            string mrn = "MRN-99999";
            if (request.Token.StartsWith("DEMO_MAGIC_"))
            {
                var parts = request.Token.Split('_');
                if (parts.Length > 2) mrn = parts[2];
            }
            else if (request.Token.StartsWith("DEMO_CAREGIVER_"))
            {
                isCaregiver = true;
                var parts = request.Token.Split('_');
                if (parts.Length > 2) mrn = parts[2];
            }

            var patient = await _context.Patients
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Mrn == mrn);

            if (patient == null)
            {
                patient = await _context.Patients
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync();
            }

            if (patient == null)
            {
                Console.WriteLine("[AUTH] No patients found in database for Magic Login.");
                return NotFound("No patients found in database.");
            }

            patientId = patient.PatientId;
        }
        else
        {
            // Real secure cryptographic hardware-locked token validation
            var (success, errorMessage, validatedPatientId, validatedIsCaregiver) = 
                await _magicTokenService.ValidateMagicTokenAsync(request.Token, request.DeviceId ?? string.Empty);

            if (!success)
            {
                Console.WriteLine($"[AUTH] Secure magic login failed: {errorMessage}");
                return BadRequest(errorMessage);
            }

            patientId = validatedPatientId;
            isCaregiver = validatedIsCaregiver;
        }

        var patientEntity = await _context.Patients
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.PatientId == patientId);

        if (patientEntity == null)
        {
            return NotFound("Patient not found.");
        }

        var patientAccount = await _context.PatientAccounts
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(pa => pa.PatientId == patientEntity.PatientId);

        if (patientAccount == null)
        {
            Console.WriteLine($"[AUTH] PatientAccount not found, creating one for patient: {patientEntity.PatientId}");
            
            // Temporary block to resolve user mapping for first patient user setup
            var patientUserEmail = $"{patientEntity.FirstName.ToLower().Replace(" ", "")}.{patientEntity.LastName.ToLower().Replace(" ", "")}@patient.emr";
            var existingPatientUser = await _userManager.FindByEmailAsync(patientUserEmail);
            if (existingPatientUser == null)
            {
                try
                {
                    existingPatientUser = new ApplicationUser
                    {
                        Id = Guid.NewGuid().ToString(),
                        UserName = patientUserEmail,
                        Email = patientUserEmail,
                        FirstName = patientEntity.FirstName,
                        LastName = patientEntity.LastName,
                        EmailConfirmed = true,
                        TenantId = patientEntity.TenantId
                    };
                    var result = await _userManager.CreateAsync(existingPatientUser, "PatientPassword@123!");
                    if (result.Succeeded)
                    {
                        if (!await _roleManager.RoleExistsAsync("Patient"))
                        {
                            await _roleManager.CreateAsync(new IdentityRole("Patient"));
                        }
                        await _userManager.AddToRoleAsync(existingPatientUser, "Patient");
                    }
                    else
                    {
                        existingPatientUser = await _userManager.FindByEmailAsync(patientUserEmail) ?? existingPatientUser;
                    }
                }
                catch
                {
                    existingPatientUser = await _userManager.FindByEmailAsync(patientUserEmail);
                    if (existingPatientUser == null)
                    {
                        throw;
                    }
                }
            }

            patientAccount = new PatientAccount
            {
                PatientAccountId = Guid.NewGuid(),
                TenantId = patientEntity.TenantId,
                PatientId = patientEntity.PatientId,
                UserId = Guid.Parse(existingPatientUser.Id),
                IsActive = true
            };
            _context.PatientAccounts.Add(patientAccount);
            try
            {
                await _context.SaveChangesAsync(default);
            }
            catch (DbUpdateException)
            {
                // Unique constraint violation (likely due to concurrent requests)
                // Detach the failed entity to clean up change tracker
                var entry = ((DbContext)_context).Entry(patientAccount);
                if (entry != null)
                {
                    entry.State = EntityState.Detached;
                }
                
                // Fetch the one inserted by the concurrent request
                patientAccount = await _context.PatientAccounts
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(pa => pa.PatientId == patientEntity.PatientId);
            }
        }

        // Get or create the user for either the caregiver or the patient
        string userEmail;
        string firstName;
        string lastName;
        string role = isCaregiver ? "Caregiver" : "Patient";

        // Query primary contact to personalize the caregiver user
        var contact = await _context.PatientContacts
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.PatientId == patientEntity.PatientId && c.IsPrimaryContact);

        if (isCaregiver)
        {
            if (contact != null && !string.IsNullOrEmpty(contact.Email))
            {
                userEmail = contact.Email;
                firstName = contact.FirstName;
                lastName = contact.LastName;
            }
            else
            {
                userEmail = $"{patientEntity.FirstName.ToLower().Replace(" ", "")}.caregiver@patient.emr";
                firstName = patientEntity.FirstName;
                lastName = "Caregiver";
            }
        }
        else
        {
            userEmail = $"{patientEntity.FirstName.ToLower().Replace(" ", "")}.{patientEntity.LastName.ToLower().Replace(" ", "")}@patient.emr";
            firstName = patientEntity.FirstName;
            lastName = patientEntity.LastName;
        }

        var user = await _userManager.FindByEmailAsync(userEmail);

        if (user == null)
        {
            Console.WriteLine($"[AUTH] User not found for {role}, creating new user: {userEmail}");
            try
            {
                user = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString(),
                    UserName = userEmail,
                    Email = userEmail,
                    FirstName = firstName,
                    LastName = lastName,
                    EmailConfirmed = true,
                    TenantId = patientEntity.TenantId
                };

                var createResult = await _userManager.CreateAsync(user, "PatientPassword@123!");
                if (createResult.Succeeded)
                {
                    // Add Role
                    if (!await _roleManager.RoleExistsAsync(role))
                    {
                        await _roleManager.CreateAsync(new IdentityRole(role));
                    }
                    await _userManager.AddToRoleAsync(user, role);
                }
                else
                {
                    user = await _userManager.FindByEmailAsync(userEmail);
                    if (user == null)
                    {
                        Console.WriteLine($"[AUTH] Failed to create user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                        return StatusCode(500, "Failed to create user account.");
                    }
                }
            }
            catch
            {
                user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    throw;
                }
            }
        }

        // If caregiver, ensure the CaregiverLink mapping is set up in the DB
        if (isCaregiver)
        {
            var caregiverLink = await _context.CaregiverLinks
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(cl => cl.PatientAccountId == patientAccount.PatientAccountId && cl.CaregiverUserId == Guid.Parse(user.Id));

            if (caregiverLink == null)
            {
                caregiverLink = new CaregiverLink
                {
                    CaregiverLinkId = Guid.NewGuid(),
                    TenantId = patientEntity.TenantId,
                    PatientAccountId = patientAccount.PatientAccountId,
                    CaregiverUserId = Guid.Parse(user.Id),
                    FirstName = firstName,
                    LastName = lastName,
                    Relationship = contact?.Relationship ?? Domain.Enums.RelationshipType.Other,
                    Email = userEmail,
                    IsPrimary = true,
                    AccessGranted = true
                };
                _context.CaregiverLinks.Add(caregiverLink);
                await _context.SaveChangesAsync(default);
            }
        }

        // Generate JWT Token
        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("userId", user.Id),
            new Claim("patientId", patientEntity.PatientId.ToString()),
            new Claim("patientAccountId", patientAccount.PatientAccountId.ToString()),
            new Claim("tenantId", patientEntity.TenantId.ToString()),
            new Claim(ClaimTypes.Role, role)
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
                    patientId = patientEntity.PatientId,
                    patientAccountId = patientAccount.PatientAccountId,
                    tenantId = user.TenantId
                }
            }
        );
    }
}

public record LoginRequest(string Email, string Password);
public record MagicLoginRequest(string Token, string DeviceId);
public record GenerateMagicTokenRequest(Guid PatientId, bool IsCaregiver, string? DeviceId = null);
public record ResetMagicTokenDeviceRequest(Guid PatientId);

