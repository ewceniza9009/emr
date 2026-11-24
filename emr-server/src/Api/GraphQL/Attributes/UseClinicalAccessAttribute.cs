using System.Reflection;
using Application.Common.Interfaces;
using Domain.Enums;
using HotChocolate.Resolvers;
using HotChocolate.Types.Descriptors;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Api.GraphQL.Attributes;

public enum ClinicalIdSource
{
    Patient,
    Encounter,
    Appointment,
    Outreach,
    Contact,
}

/// <summary>
/// Tactical Security Middleware: Enforces Method-Level Clinical Authorization.
/// Ensures that the requesting user has a legitimate clinical relationship with the patient record.
/// </summary>
public class UseClinicalAccessAttribute(
    string argumentName = "patientId",
    ClinicalIdSource source = ClinicalIdSource.Patient,
    bool allowAnyClinicalStaff = false
) : ObjectFieldDescriptorAttribute
{
    private sealed record CachedClinicianIdentity(
        Guid UserId,
        Guid? TenantId,
        Guid? PractitionerId,
        DateTimeOffset? EmergencyAccessExpiry,
        bool IsAdmin
    );

    protected override void OnConfigure(
        IDescriptorContext context,
        IObjectFieldDescriptor descriptor,
        MemberInfo member
    )
    {
        descriptor.Use(next =>
            async (IMiddlewareContext ctx) =>
            {
                var currentUserService = ctx.Service<ICurrentUserService>();
                var dbContext = ctx.Service<IApplicationDbContext>();

                var targetCacheKey = $"ClinicalTargetId:{source}:{argumentName}:{ctx.Selection.Field.Name}";
                Guid targetId;
                if (ctx.ContextData.TryGetValue(targetCacheKey, out var cachedId) && cachedId is Guid g)
                {
                    targetId = g;
                }
                else
                {
                    targetId = ResolveTargetId(ctx, argumentName);
                    ctx.ContextData[targetCacheKey] = targetId;
                }

                if (targetId == Guid.Empty)
                    throw new UnauthorizedAccessException(
                        $"Tactical Security Failure: Required clinical identifier '{argumentName}' not found in execution context."
                    );

                var userIdStr = currentUserService.UserId;
                if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
                    throw new UnauthorizedAccessException("Clinical session expired or invalid.");

                var userCacheKey = $"clinician-access:{userId}";
                CachedClinicianIdentity? clinician = null;

                if (ctx.ContextData.TryGetValue(userCacheKey, out var reqClinician) && reqClinician is CachedClinicianIdentity ci)
                {
                    clinician = ci;
                }
                else
                {
                    var memoryCache = ctx.Services.GetService<IMemoryCache>();
                    if (memoryCache == null || !memoryCache.TryGetValue(userCacheKey, out clinician))
                    {
                        var userManager = ctx.Service<UserManager<ApplicationUser>>();
                        var user = await userManager.FindByIdAsync(userIdStr);
                        if (user == null)
                            throw new UnauthorizedAccessException("Subject identity not found in registry.");

                        var roles = await userManager.GetRolesAsync(user);
                        var isAdmin = roles.Any(r =>
                            r.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                            r.Equals("Administrator", StringComparison.OrdinalIgnoreCase)
                        );

                        clinician = new CachedClinicianIdentity(
                            userId,
                            user.TenantId,
                            user.PractitionerId,
                            user.EmergencyAccessExpiry,
                            isAdmin
                        );
                        // Short TTL so Break-Glass activation takes effect rapidly
                        memoryCache?.Set(userCacheKey, clinician, TimeSpan.FromSeconds(15));
                    }

                    ctx.ContextData[userCacheKey] = clinician;
                }

                if (clinician!.EmergencyAccessExpiry > DateTimeOffset.UtcNow || clinician.IsAdmin)
                {
                    await next(ctx);
                    return;
                }

                var (patientId, tenantId) = await ResolvePatientAndTenant(dbContext, source, targetId, ctx.RequestAborted);

                if (tenantId != Guid.Empty && clinician.TenantId != tenantId)
                {
                    throw new UnauthorizedAccessException("Cross-tenant clinical access violation detected. Security audit triggered.");
                }

                if (allowAnyClinicalStaff)
                {
                    await next(ctx);
                    return;
                }

                var practitionerId = clinician.PractitionerId;

                if (patientId != Guid.Empty)
                {
                    var isAssigned = await dbContext.CareNavigationCases.AnyAsync(
                        c => c.PatientId == patientId
                             && (c.NavigatorId == userId || (practitionerId.HasValue && c.NavigatorId == practitionerId.Value))
                             && c.Status == CaseStatus.Open,
                        ctx.RequestAborted
                    );

                    if (isAssigned)
                    {
                        await next(ctx);
                        return;
                    }

                    var hasAppointment = await dbContext.Appointments.AnyAsync(
                        a => a.PatientId == patientId
                             && (a.PractitionerId == userId || (practitionerId.HasValue && a.PractitionerId == practitionerId.Value)),
                        ctx.RequestAborted
                    );

                    if (hasAppointment)
                    {
                        await next(ctx);
                        return;
                    }
                }
                else if (source == ClinicalIdSource.Outreach)
                {
                    var isOutreachAssignee = await dbContext.PatientOutreaches.AnyAsync(
                        o => o.PatientOutreachId == targetId
                             && (o.AssignedPractitionerId == userId || (practitionerId.HasValue && o.AssignedPractitionerId == practitionerId.Value)),
                        ctx.RequestAborted
                    );

                    if (isOutreachAssignee)
                    {
                        await next(ctx);
                        return;
                    }
                }

                throw new UnauthorizedAccessException(
                    "Tactical Security Violation: Authenticated user lacks an active clinical relationship with this record."
                );
            }
        );
    }

    private static Guid ResolveTargetId(IMiddlewareContext ctx, string name)
    {
        if (ctx.Selection.Field.Arguments.Any(a => a.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
        {
            try { return ctx.ArgumentValue<Guid>(name); } catch { }
        }

        foreach (var containerName in new[] { "input", "command" })
        {
            if (ctx.Selection.Field.Arguments.Any(a => a.Name == containerName))
            {
                try
                {
                    var container = ctx.ArgumentValue<object>(containerName);
                    if (container != null)
                    {
                        var prop = container.GetType().GetProperty(name, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                        if (prop != null && prop.GetValue(container) is Guid val)
                            return val;
                    }
                }
                catch { }
            }
        }

        return Guid.Empty;
    }

    private static async Task<(Guid PatientId, Guid TenantId)> ResolvePatientAndTenant(
        IApplicationDbContext dbContext,
        ClinicalIdSource source,
        Guid targetId,
        CancellationToken ct)
    {
        switch (source)
        {
            case ClinicalIdSource.Patient:
                var p = await dbContext.Patients
                    .AsNoTracking()
                    .Where(x => x.PatientId == targetId)
                    .Select(x => new { x.PatientId, x.TenantId })
                    .FirstOrDefaultAsync(ct);
                return (p?.PatientId ?? Guid.Empty, p?.TenantId ?? Guid.Empty);

            case ClinicalIdSource.Encounter:
                var e = await dbContext.ClinicalEncounters
                    .AsNoTracking()
                    .Where(x => x.EncounterId == targetId)
                    .Select(x => new { x.PatientId, x.TenantId })
                    .FirstOrDefaultAsync(ct);
                return (e?.PatientId ?? Guid.Empty, e?.TenantId ?? Guid.Empty);

            case ClinicalIdSource.Appointment:
                var a = await dbContext.Appointments
                    .AsNoTracking()
                    .Where(x => x.AppointmentId == targetId)
                    .Select(x => new { x.PatientId, x.TenantId })
                    .FirstOrDefaultAsync(ct);
                return (a?.PatientId ?? Guid.Empty, a?.TenantId ?? Guid.Empty);

            case ClinicalIdSource.Outreach:
                var o = await dbContext.PatientOutreaches
                    .AsNoTracking()
                    .Where(x => x.PatientOutreachId == targetId)
                    .Select(x => new { x.EnrolledPatientId, x.TenantId })
                    .FirstOrDefaultAsync(ct);
                return (o?.EnrolledPatientId ?? Guid.Empty, o?.TenantId ?? Guid.Empty);

            case ClinicalIdSource.Contact:
                var c = await dbContext.PatientContacts
                    .AsNoTracking()
                    .Where(x => x.ContactId == targetId)
                    .Select(x => new { x.PatientId, x.TenantId })
                    .FirstOrDefaultAsync(ct);
                return (c?.PatientId ?? Guid.Empty, c?.TenantId ?? Guid.Empty);

            default:
                return (Guid.Empty, Guid.Empty);
        }
    }
}
