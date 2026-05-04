using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record RescheduleAppointmentCommand(
    Guid AppointmentId,
    DateTimeOffset NewStart,
    DateTimeOffset NewEnd
) : IRequest<Appointment>;

public class RescheduleAppointmentCommandHandler(
    IApplicationDbContext context,
    ISchedulingService schedulingService
) : IRequestHandler<RescheduleAppointmentCommand, Appointment>
{
    public async Task<Appointment> Handle(
        RescheduleAppointmentCommand request,
        CancellationToken cancellationToken
    )
    {
        var appointment = await context.Appointments.FirstOrDefaultAsync(
            a => a.AppointmentId == request.AppointmentId,
            cancellationToken
        );

        if (appointment == null)
        {
            throw new Exception("Appointment not found");
        }

        appointment.ScheduledStart = request.NewStart;
        appointment.ScheduledEnd = request.NewEnd;

        await context.SaveChangesAsync(cancellationToken);

        // Recalculate stats after saving the new time
        var stats = await schedulingService.RecalculateAppointmentStatsAsync(
            appointment.AppointmentId,
            cancellationToken
        );
        appointment.DistanceInMiles = stats.distance;
        appointment.TravelTimeMinutes = stats.travelTime;

        await context.SaveChangesAsync(cancellationToken);

        return appointment;
    }
}
