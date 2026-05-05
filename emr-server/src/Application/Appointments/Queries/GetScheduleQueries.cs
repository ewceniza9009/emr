using System;
using Application.Common.Models;
using Domain.Entities;
using MediatR;

namespace Application.Appointments.Queries;

public record GetAppointmentsQuery(DateTime? StartDate = null, DateTime? EndDate = null)
    : IRequest<PagedResponse<Appointment>>;

public record GetScheduleBlocksQuery(DateTime? StartDate = null, DateTime? EndDate = null)
    : IRequest<PagedResponse<ScheduleBlock>>;
