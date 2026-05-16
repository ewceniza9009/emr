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
    ISchedulingService schedulingService,
    INotificationService notificationService
) : IRequestHandler<RescheduleAppointmentCommand, RescheduleAppointmentResponse>
{
    public async Task<RescheduleAppointmentResponse> Handle(
        RescheduleAppointmentCommand request,
        CancellationToken cancellationToken
    )
    {
        var appointment = await context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Practitioner)
            .FirstOrDefaultAsync(
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

        var oldStart = appointment.ScheduledStart;
        var practitionerId = appointment.PractitionerId;

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

        // Update logistics for the appointment that follows the new position
        if (appointment.PractitionerId.HasValue)
        {
            await UpdateNextAppointmentStats(appointment.PractitionerId.Value, appointment.ScheduledStart, cancellationToken);
        }

        // Update logistics for the appointment that used to follow this one in its old position
        if (oldStart != appointment.ScheduledStart && practitionerId.HasValue)
        {
            await UpdateNextAppointmentStats(practitionerId.Value, oldStart, cancellationToken);
        }

        // Send Notification
        var patientName = appointment.Patient != null ? $"{appointment.Patient.FirstName} {appointment.Patient.LastName}" : "Unknown Patient";
        var clinicianName = appointment.Practitioner != null ? $"{appointment.Practitioner.FirstName} {appointment.Practitioner.LastName}" : "Unknown Clinician";

        await notificationService.SendGlobalNotificationAsync(
            "Appointment Rescheduled",
            $"Appointment for {patientName} with {clinicianName} has been moved to {request.NewStart:f}.",
            Domain.Enums.NotificationPriority.Normal,
            category: "Scheduling",
            actionUrl: $"/dashboard/patients/{appointment.PatientId}"
        );

        return new RescheduleAppointmentResponse(appointment);
    }

    private async Task UpdateNextAppointmentStats(Guid practitionerId, DateTimeOffset afterTime, CancellationToken cancellationToken)
    {
        var nextAppt = await context.Appointments
            .Where(a => a.PractitionerId == practitionerId && a.ScheduledStart > afterTime && a.ScheduledStart < afterTime.Date.AddDays(1))
            .OrderBy(a => a.ScheduledStart)
            .FirstOrDefaultAsync(cancellationToken);

        if (nextAppt != null)
        {
            var stats = await schedulingService.RecalculateAppointmentStatsAsync(nextAppt, cancellationToken);
            nextAppt.TravelTimeMinutes = stats.travelTime;
            nextAppt.DistanceInMiles = stats.distance;
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
