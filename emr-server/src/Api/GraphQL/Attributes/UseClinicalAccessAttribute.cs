using System.Reflection;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Resolvers;
using HotChocolate.Types.Descriptors;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

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
                var userManager = ctx.Service<UserManager<ApplicationUser>>();
                var dbContext = ctx.Service<IApplicationDbContext>();

                Guid targetId = Guid.Empty;

                // 1. TACTICAL ARGUMENT RESOLUTION
                if (ctx.ContextData.TryGetValue("ClinicalTargetId", out var cachedId))
                {
                    targetId = (Guid)cachedId!;
                }
                else
                {
                    targetId = ResolveTargetId(ctx, argumentName);
                    ctx.ContextData["ClinicalTargetId"] = targetId;
                }

                if (targetId == Guid.Empty)
                    throw new UnauthorizedAccessException(
                        $"Tactical Security Failure: Required clinical identifier '{argumentName}' not found in execution context."
                    );

                // 2. IDENTITY VERIFICATION
                var userIdStr = currentUserService.UserId;
                if (string.IsNullOrEmpty(userIdStr))
                    throw new UnauthorizedAccessException("Clinical session expired or invalid.");

                var user = await userManager.FindByIdAsync(userIdStr);
                if (user == null)
                    throw new UnauthorizedAccessException("Subject identity not found in registry.");

                // 3. EMERGENCY & ADMINISTRATIVE BYPASS
                if (user.EmergencyAccessExpiry > DateTimeOffset.UtcNow)
                {
                    await next(ctx);
                    return;
                }

                var roles = await userManager.GetRolesAsync(user);
                if (roles.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase) || r.Equals("Administrator", StringComparison.OrdinalIgnoreCase)))
                {
                    await next(ctx);
                    return;
                }

                // 4. RESOURCE-PATIENT RESOLUTION & TENANT ISOLATION
                var (patientId, tenantId) = await ResolvePatientAndTenant(dbContext, source, targetId, ctx.RequestAborted);

                if (tenantId != Guid.Empty && user.TenantId != tenantId)
                {
                    throw new UnauthorizedAccessException("Cross-tenant clinical access violation detected. Security audit triggered.");
                }

                // 5. CLINICAL RELATIONSHIP VERIFICATION
                if (allowAnyClinicalStaff)
                {
                    await next(ctx);
                    return;
                }

                if (!Guid.TryParse(userIdStr, out var userId))
                    throw new UnauthorizedAccessException("Invalid subject identity format.");

                if (patientId != Guid.Empty)
                {
                    var isAssigned = await dbContext.CareNavigationCases.AnyAsync(
                        c => c.PatientId == patientId && c.NavigatorId == userId && c.Status == CaseStatus.Open,
                        ctx.RequestAborted
                    );

                    if (isAssigned)
                    {
                        await next(ctx);
                        return;
                    }

                    var hasAppointment = await dbContext.Appointments.AnyAsync(
                        a => a.PatientId == patientId && a.PractitionerId == userId,
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
                        o => o.PatientOutreachId == targetId && o.AssignedPractitionerId == userId,
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
                var p = await dbContext.Patients.AsNoTracking().FirstOrDefaultAsync(x => x.PatientId == targetId, ct);
                return (p?.PatientId ?? Guid.Empty, p?.TenantId ?? Guid.Empty);

            case ClinicalIdSource.Encounter:
                var e = await dbContext.ClinicalEncounters.AsNoTracking().FirstOrDefaultAsync(x => x.EncounterId == targetId, ct);
                return (e?.PatientId ?? Guid.Empty, e?.TenantId ?? Guid.Empty);

            case ClinicalIdSource.Appointment:
                var a = await dbContext.Appointments.AsNoTracking().FirstOrDefaultAsync(x => x.AppointmentId == targetId, ct);
                return (a?.PatientId ?? Guid.Empty, a?.TenantId ?? Guid.Empty);

            case ClinicalIdSource.Outreach:
                var o = await dbContext.PatientOutreaches.AsNoTracking().FirstOrDefaultAsync(x => x.PatientOutreachId == targetId, ct);
                return (o?.EnrolledPatientId ?? Guid.Empty, o?.TenantId ?? Guid.Empty);

            case ClinicalIdSource.Contact:
                var c = await dbContext.PatientContacts.AsNoTracking().FirstOrDefaultAsync(x => x.ContactId == targetId, ct);
                return (c?.PatientId ?? Guid.Empty, c?.TenantId ?? Guid.Empty);

            default:
                return (Guid.Empty, Guid.Empty);
        }
    }
}
