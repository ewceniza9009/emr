using Application.Appointments.Dtos;
using Application.Appointments.Queries;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using Infrastructure.Identity;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanViewPatients")]
public class AppointmentQuery
{
    private readonly ISecurityAuditService _auditService;
    private readonly ICurrentUserService _currentUserService;

    public AppointmentQuery(
        ISecurityAuditService auditService,
        ICurrentUserService currentUserService
    )
    {
        _auditService = auditService;
        _currentUserService = currentUserService;
    }

    private async Task<bool> VerifyClinicalAccess(
        Guid patientId,
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
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
            c => c.PatientId == patientId && c.NavigatorId == userId && c.Status == CaseStatus.Open,
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

    [GraphQLName("appointments")]
    [UseFiltering]
    [UseSorting]
    public async Task<PagedResponse<AppointmentDto>> GetAppointments(
        [Service] IApplicationDbContext context,
        [Service] UserManager<ApplicationUser> userManager,
        DateTime? startDate = null,
        DateTime? endDate = null,
        Guid? patientId = null,
        Guid? id = null
    )
    {
        var query = context
            .Appointments.Include(a => a.Patient)
            .Include(a => a.Practitioner)
            .Include(a => a.SupportingClinicians)
            .Include(a => a.Encounters)
            .AsNoTracking();

        if (startDate.HasValue)
            query = query.Where(a => a.ScheduledStart >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(a => a.ScheduledStart <= endDate.Value);

        if (patientId.HasValue)
            query = query.Where(a => a.PatientId == patientId.Value);

        if (id.HasValue)
            query = query.Where(a => a.AppointmentId == id.Value);

        var totalCount = await query.CountAsync();
        var items = await query.ProjectToType<AppointmentDto>().ToListAsync();

        return new PagedResponse<AppointmentDto>
        {
            Items = items,
            TotalCount = totalCount
        };
    }

    [GraphQLName("appointment")]
    public async Task<AppointmentDto?> GetAppointmentById(
        Guid id, 
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        if (!await VerifyClinicalAccess(id, userManager, context, cancellationToken))
             throw new UnauthorizedAccessException("Clinical assignment required for scheduling access.");

        return await context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Practitioner)
            .Include(a => a.SupportingClinicians)
            .Include(a => a.Encounters)
            .Where(a => a.AppointmentId == id)
            .AsNoTracking()
            .ProjectToType<AppointmentDto>()
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<AvailableProviderDto>> GetAvailableProviders(
        Guid patientId,
        DateTimeOffset targetStart,
        int durationMinutes,
        AppointmentModality modality,
        [Service] IMediator mediator,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(
            new GetAvailableProvidersQuery(patientId, targetStart, durationMinutes, modality),
            cancellationToken
        );
    }

    public async Task<List<ScheduleBlock>> GetScheduleBlocks(
        [Service] IApplicationDbContext context,
        DateTime? startDate = null, 
        DateTime? endDate = null)
    {
        var query = context.ScheduleBlocks
            .Include(b => b.Practitioner)
            .AsNoTracking();

        if (startDate.HasValue)
            query = query.Where(b => b.StartTime >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(b => b.EndTime <= endDate.Value);

        return await query.ToListAsync();
    }
}
