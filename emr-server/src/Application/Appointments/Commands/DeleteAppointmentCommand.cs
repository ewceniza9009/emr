using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record DeleteAppointmentCommand(Guid AppointmentId) : IRequest<DeleteAppointmentResponse>;

public record DeleteAppointmentResponse(bool Success, string? Error = null);

public class DeleteAppointmentCommandHandler(
    IApplicationDbContext context,
    INotificationService notificationService,
    ISchedulingService schedulingService
) : IRequestHandler<DeleteAppointmentCommand, DeleteAppointmentResponse>
{
    public async Task<DeleteAppointmentResponse> Handle(
        DeleteAppointmentCommand request,
        CancellationToken cancellationToken
    )
    {
        var appointment = await context
            .Appointments.Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId, cancellationToken);

        if (appointment == null)
            return new DeleteAppointmentResponse(false, "Appointment not found");

        if (appointment.Status == AppointmentStatus.InProgress)
        {
            return new DeleteAppointmentResponse(
                false,
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
                nextAppt,
                cancellationToken
            );
            nextAppt.TravelTimeMinutes = nextStats.travelTime;
            nextAppt.DistanceInMiles = nextStats.distance;
            await context.SaveChangesAsync(cancellationToken);
        }

        // Notify team
        await notificationService.SendGlobalNotificationAsync(
            "Appointment Cancelled",
            $"Appointment for {patientName} on {startTime} with clinician {practitionerId} has been removed from the schedule.",
            Domain.Enums.NotificationPriority.High,
            category: "Scheduling",
            actionUrl: "/dashboard/schedule"
        );

        return new DeleteAppointmentResponse(true);
    }
}
