using Application.Common.Interfaces;
using Application.Outreach.Queries;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanManageOutreach")]
public class OutreachQuery
{
    private readonly ICurrentUserService _currentUserService;

    public OutreachQuery(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    private async Task<bool> VerifyClinicalAccess(
        Guid? patientId,
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (patientId == null)
            return true; // If not enrolled yet, standard "CanManageOutreach" policy applies

        var userIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userIdStr))
            return false;

        var user = await userManager.FindByIdAsync(userIdStr);
        if (user == null)
            return false;

        if (user.EmergencyAccessExpiry > DateTimeOffset.UtcNow)
            return true;

        var roles = await userManager.GetRolesAsync(user);
        if (
            roles.Contains("Administrator")
            || roles.Contains("System Admin")
            || roles.Contains("Admin")
        )
            return true;

        if (!Guid.TryParse(userIdStr, out var userId))
            return false;

        var isAssigned = await context.CareNavigationCases.AnyAsync(
            c =>
                c.PatientId == patientId
                && c.NavigatorId == userId
                && c.Status == CaseStatus.Open,
            cancellationToken
        );

        if (isAssigned)
            return true;

        var hasAppointment = await context.Appointments.AnyAsync(
            a => a.PatientId == patientId && a.PractitionerId == userId,
            cancellationToken
        );

        return hasAppointment;
    }

    [UseOffsetPaging(DefaultPageSize = 50)]
    [UseFiltering]
    [UseSorting]
    public IQueryable<PatientOutreach> GetOutreaches([Service] IApplicationDbContext context)
    {
        return context.PatientOutreaches.Include(o => o.Activities).AsNoTracking();
    }

    [UseFirstOrDefault]
    public async Task<IQueryable<PatientOutreach>> GetOutreachById(
        Guid outreachId,
        [Service] IApplicationDbContext context,
        [Service] UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken
    )
    {
        var outreach = await context
            .PatientOutreaches.AsNoTracking()
            .FirstOrDefaultAsync(o => o.PatientOutreachId == outreachId, cancellationToken);

        if (outreach != null && outreach.EnrolledPatientId.HasValue)
        {
            if (
                !await VerifyClinicalAccess(
                    outreach.EnrolledPatientId.Value,
                    userManager,
                    context,
                    cancellationToken
                )
            )
                throw new UnauthorizedAccessException("Clinical context verification failed.");
        }

        return context
            .PatientOutreaches.Include(o => o.OtherContacts)
            .Include(o => o.Activities)
            .Where(o => o.PatientOutreachId == outreachId)
            .AsNoTracking();
    }
}
