using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record RescheduleAppointmentCommand(
    Guid AppointmentId,
    DateTimeOffset NewStart,
    DateTimeOffset NewEnd,
    bool RecalculateTravelTime = true
) : IRequest<RescheduleAppointmentResponse>;

public record RescheduleAppointmentResponse(Appointment? Appointment, string? Error = null);

public class RescheduleAppointmentCommandHandler(
    IApplicationDbContext context,
    ISchedulingService schedulingService
) : IRequestHandler<RescheduleAppointmentCommand, RescheduleAppointmentResponse>
{
    public async Task<RescheduleAppointmentResponse> Handle(
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
            return new RescheduleAppointmentResponse(null, "Appointment not found");
        }

        if (appointment.Status == Domain.Enums.AppointmentStatus.InProgress)
        {
            return new RescheduleAppointmentResponse(
                null,
                "Cannot reschedule an appointment that is already in progress."
            );
        }

        appointment.ScheduledStart = request.NewStart;
        appointment.ScheduledEnd = request.NewEnd;

        await context.SaveChangesAsync(cancellationToken);

        if (request.RecalculateTravelTime)
        {
            // Recalculate stats after saving the new time
            var stats = await schedulingService.RecalculateAppointmentStatsAsync(
                appointment,
                cancellationToken
            );
            appointment.DistanceInMiles = stats.distance;
            appointment.TravelTimeMinutes = stats.travelTime;

            await context.SaveChangesAsync(cancellationToken);

            // Validate logistics for the new time slot
            var (isValid, reason) = await schedulingService.ValidateLogisticsAsync(
                appointment,
                cancellationToken
            );
            if (!isValid)
            {
                return new RescheduleAppointmentResponse(null, reason);
            }
        }

        // Also update the next appointment's logistics as they may have changed
        var nextAppt = await context
            .Appointments.Where(a =>
                a.PractitionerId == appointment.PractitionerId
                && a.ScheduledStart > appointment.ScheduledStart
                && a.ScheduledStart < request.NewStart.Date.AddDays(1)
            )
            .OrderBy(a => a.ScheduledStart)
            .FirstOrDefaultAsync(cancellationToken);

        if (nextAppt != null)
        {
            var nextStats = await schedulingService.RecalculateAppointmentStatsAsync(
                nextAppt,
                cancellationToken
            );
            nextAppt.TravelTimeMinutes = nextStats.travelTime;
            nextAppt.DistanceInMiles = nextStats.distance;
            await context.SaveChangesAsync(cancellationToken);
        }

        return new RescheduleAppointmentResponse(appointment);
    }
}
