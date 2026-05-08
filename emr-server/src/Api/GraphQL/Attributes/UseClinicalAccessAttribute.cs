using System.Reflection;
using Application.Common.Interfaces;
using Domain.Enums;
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

public class UseClinicalAccessAttribute(
    string argumentName = "patientId",
    ClinicalIdSource source = ClinicalIdSource.Patient
) : ObjectFieldDescriptorAttribute
{
    protected override void OnConfigure(
        IDescriptorContext context,
        IObjectFieldDescriptor descriptor,
        MemberInfo member
    )
    {
        descriptor.Use(next =>
            async ctx =>
            {
                var currentUserService = ctx.Service<ICurrentUserService>();
                var userManager = ctx.Service<UserManager<ApplicationUser>>();
                var dbContext = ctx.Service<IApplicationDbContext>();

                Guid? patientId = null;
                Guid targetId = Guid.Empty;

                // TRY TO RESOLVE TARGET ID FROM ARGUMENTS (OR NESTED IN INPUT)
                try
                {
                    // Direct Argument Case
                    targetId = ctx.ArgumentValue<Guid>(argumentName);
                }
                catch
                {
                    // Nested Input Case (e.g. input.PatientId)
                    try
                    {
                        var input = ctx.ArgumentValue<object>("input");
                        if (input != null)
                        {
                            var prop = input
                                .GetType()
                                .GetProperty(
                                    argumentName,
                                    BindingFlags.Public
                                        | BindingFlags.Instance
                                        | BindingFlags.IgnoreCase
                                );
                            if (prop != null)
                            {
                                var val = prop.GetValue(input);
                                if (val is Guid g)
                                    targetId = g;
                            }
                        }
                    }
                    catch
                    { /* Ignore and fail later if Guid.Empty */
                    }
                }

                if (targetId == Guid.Empty)
                    throw new UnauthorizedAccessException(
                        $"Tactical Security Failure: Required argument '{argumentName}' not found in resolver context."
                    );

                // RESOLVE PATIENT ID BASED ON SOURCE
                switch (source)
                {
                    case ClinicalIdSource.Patient:
                        patientId = targetId;
                        break;
                    case ClinicalIdSource.Encounter:
                        var encounter = await dbContext
                            .ClinicalEncounters.AsNoTracking()
                            .FirstOrDefaultAsync(
                                e => e.EncounterId == targetId,
                                ctx.RequestAborted
                            );
                        patientId = encounter?.PatientId;
                        break;
                    case ClinicalIdSource.Appointment:
                        var appt = await dbContext
                            .Appointments.AsNoTracking()
                            .FirstOrDefaultAsync(
                                a => a.AppointmentId == targetId,
                                ctx.RequestAborted
                            );
                        patientId = appt?.PatientId;
                        break;
                    case ClinicalIdSource.Outreach:
                        var outreach = await dbContext
                            .PatientOutreaches.AsNoTracking()
                            .FirstOrDefaultAsync(
                                o => o.PatientOutreachId == targetId,
                                ctx.RequestAborted
                            );
                        patientId = outreach?.EnrolledPatientId;
                        break;
                    case ClinicalIdSource.Contact:
                        var contact = await dbContext
                            .PatientContacts.AsNoTracking()
                            .FirstOrDefaultAsync(c => c.ContactId == targetId, ctx.RequestAborted);
                        patientId = contact?.PatientId;
                        break;
                }

                if (patientId == null || patientId == Guid.Empty)
                {
                    // If it's an outreach that isn't enrolled yet, we allow standard policy access (CanManageOutreach)
                    if (source == ClinicalIdSource.Outreach)
                    {
                        await next(ctx);
                        return;
                    }
                    throw new UnauthorizedAccessException(
                        "Could not resolve patient context for clinical verification."
                    );
                }

                var userIdStr = currentUserService.UserId;

                if (string.IsNullOrEmpty(userIdStr))
                    throw new UnauthorizedAccessException("Session expired or invalid.");

                var user = await userManager.FindByIdAsync(userIdStr);
                if (user == null)
                    throw new UnauthorizedAccessException("User not found.");

                // 1. EMERGENCY ACCESS BYPASS: If 'Break Glass' is active
                if (user.EmergencyAccessExpiry > DateTimeOffset.UtcNow)
                {
                    await next(ctx);
                    return;
                }

                // 2. ADMINISTRATIVE BYPASS: System Admins have full visibility
                var roles = await userManager.GetRolesAsync(user);
                if (roles.Any(r => r.Contains("Admin") || r.Contains("Administrator")))
                {
                    await next(ctx);
                    return;
                }

                if (!Guid.TryParse(userIdStr, out var userId))
                    throw new UnauthorizedAccessException("Invalid user identity.");

                // 3. CASE ASSIGNMENT CHECK: Is this user the Care Navigator for this patient?
                var isAssigned = await dbContext.CareNavigationCases.AnyAsync(
                    c =>
                        c.PatientId == patientId
                        && c.NavigatorId == userId
                        && c.Status == CaseStatus.Open,
                    ctx.RequestAborted
                );

                if (isAssigned)
                {
                    await next(ctx);
                    return;
                }

                // 4. APPOINTMENT LINK CHECK: Does this user have a scheduled appointment with this patient?
                var hasAppointment = await dbContext.Appointments.AnyAsync(
                    a => a.PatientId == patientId && a.PractitionerId == userId,
                    ctx.RequestAborted
                );

                if (hasAppointment)
                {
                    await next(ctx);
                    return;
                }

                throw new UnauthorizedAccessException(
                    "Tactical Security Violation: Clinical access required for this patient record."
                );
            }
        );
    }
}
