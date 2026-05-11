using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record DeleteAppointmentCommand(Guid AppointmentId) : IRequest<bool>;

public class DeleteAppointmentCommandHandler(
    IApplicationDbContext context,
    INotificationService notificationService,
    ISchedulingService schedulingService
) : IRequestHandler<DeleteAppointmentCommand, bool>
{
    public async Task<bool> Handle(
        DeleteAppointmentCommand request,
        CancellationToken cancellationToken
    )
    {
        var appointment = await context
            .Appointments.Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId, cancellationToken);

        if (appointment == null)
            return false;

        if (appointment.Status == Domain.Enums.AppointmentStatus.InProgress)
        {
            throw new InvalidOperationException(
                "Cannot delete an appointment that is already in progress."
            );
        }

        var practitionerId = appointment.PractitionerId.ToString();
        var patientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}";
        var startTime = appointment.ScheduledStart.ToString("MM/dd HH:mm");

        var practitionerIdRaw = appointment.PractitionerId;
        var dateRaw = appointment.ScheduledStart;

        context.Appointments.Remove(appointment);
        await context.SaveChangesAsync(cancellationToken);

        // RECALCULATE NEXT APPOINTMENT: It now might have a different predecessor (or none)
        var nextAppt = await context
            .Appointments.Where(a =>
                a.PractitionerId == practitionerIdRaw
                && a.ScheduledStart > dateRaw
                && a.ScheduledStart < dateRaw.Date.AddDays(1)
            )
            .OrderBy(a => a.ScheduledStart)
            .FirstOrDefaultAsync(cancellationToken);

        if (nextAppt != null)
        {
            var nextStats = await schedulingService.RecalculateAppointmentStatsAsync(
                nextAppt.AppointmentId,
                cancellationToken
            );
            nextAppt.TravelTimeMinutes = nextStats.travelTime;
            nextAppt.DistanceInMiles = nextStats.distance;
            await context.SaveChangesAsync(cancellationToken);
        }

        // Notify practitioner
        await notificationService.SendUserNotificationAsync(
            practitionerId,
            "Appointment Cancelled",
            $"Your appointment with {patientName} on {startTime} has been removed from the schedule.",
            Domain.Enums.NotificationPriority.High
        );

        return true;
    }
}
