using Application.Appointments.Dtos;
using Application.Common.Models;
using Domain.Entities;
using MediatR;

namespace Application.Appointments.Queries;

public record GetAppointmentsQuery(
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    int Skip = 0,
    int Take = 100
) : IRequest<PagedResponse<AppointmentDto>>;

public record GetScheduleBlocksQuery(
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    int Skip = 0,
    int Take = 100
) : IRequest<PagedResponse<ScheduleBlock>>;
