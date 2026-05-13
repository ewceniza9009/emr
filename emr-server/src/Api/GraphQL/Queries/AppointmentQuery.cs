using Application.Appointments.Dtos;
using Application.Appointments.Queries;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Api.GraphQL.Attributes;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanViewPatients")]
public class AppointmentQuery
{
    private readonly ISecurityAuditService _auditService;

    public AppointmentQuery(ISecurityAuditService auditService)
    {
        _auditService = auditService;
    }

    [GraphQLName("appointments")]
    [UseFiltering]
    [UseSorting]
    public async Task<PagedResponse<AppointmentDto>> GetAppointments(
        [Service] IApplicationDbContext context,
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
    [UseClinicalAccess(argumentName: "id", source: ClinicalIdSource.Appointment)]
    public async Task<AppointmentDto?> GetAppointmentById(
        Guid id, 
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken)
    {
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
        CancellationToken cancellationToken,
        Guid? appointmentId = null
    )
    {
        return await mediator.Send(
            new GetAvailableProvidersQuery(patientId, targetStart, durationMinutes, modality, appointmentId),
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

    [GraphQLName("availableProvidersForReassignment")]
    public async Task<List<ReassignmentProviderDto>> GetAvailableProvidersForReassignment(
        Guid appointmentId,
        [Service] ISchedulingService schedulingService,
        CancellationToken cancellationToken
    )
    {
        return await schedulingService.GetAvailableProvidersForReassignmentAsync(appointmentId, cancellationToken);
    }
}
