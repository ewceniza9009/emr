using Application.Appointments.Dtos;
using Application.Appointments.Queries;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class AppointmentQuery
{
    public async Task<List<AppointmentDto>> GetAppointmentsByPatient(
        Guid patientId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(new GetAppointmentsByPatientQuery(patientId), cancellationToken);
    }

    /// <summary>
    /// Full appointment list with patient + practitioner navigation.
    /// Used by the weekly scheduling calendar.
    /// </summary>
    public async Task<Application.Common.Models.PagedResponse<Appointment>> GetAppointments(
        [Service] IMediator mediator,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default
    )
    {
        return await mediator.Send(new GetAppointmentsQuery(startDate, endDate), cancellationToken);
    }

    public async Task<Application.Common.Models.PagedResponse<ScheduleBlock>> GetScheduleBlocks(
        [Service] IMediator mediator,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default
    )
    {
        return await mediator.Send(
            new GetScheduleBlocksQuery(startDate, endDate),
            cancellationToken
        );
    }

    [UseFirstOrDefault]
    public IQueryable<Appointment> GetAppointment(Guid id, [Service] IApplicationDbContext context)
    {
        return context
            .Appointments.Where(a => a.AppointmentId == id)
            .Include(a => a.Patient)
                .ThenInclude(p => p!.Addresses)
            .Include(a => a.Practitioner)
            .Include(a => a.SupportingClinicians)
            .AsNoTracking();
    }

    /// <summary>
    /// Returns available care navigators and clinicians for a given patient visit,
    /// with real-time geospatial distance and travel time from their last known location.
    /// </summary>
    public async Task<List<AvailableProviderDto>> GetAvailableProviders(
        Guid patientId,
        DateTimeOffset targetStart,
        int durationMinutes,
        AppointmentModality modality,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(
            new GetAvailableProvidersQuery(patientId, targetStart, durationMinutes, modality),
            cancellationToken
        );
    }
}
