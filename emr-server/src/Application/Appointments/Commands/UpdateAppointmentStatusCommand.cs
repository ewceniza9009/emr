using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record UpdateAppointmentStatusCommand(
    Guid AppointmentId,
    AppointmentStatus Status
) : IRequest<Appointment>;

public class UpdateAppointmentStatusCommandHandler(
    IApplicationDbContext context,
    INotificationService notificationService
) : IRequestHandler<UpdateAppointmentStatusCommand, Appointment>
{
    public async Task<Appointment> Handle(
        UpdateAppointmentStatusCommand request,
        CancellationToken cancellationToken
    )
    {
        var appointment = await context
            .Appointments.Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId, cancellationToken);

        if (appointment == null)
            throw new Exception("Appointment not found");

        if (appointment.Status == AppointmentStatus.InProgress && request.Status != AppointmentStatus.InProgress)
            throw new InvalidOperationException("Cannot change status of an appointment that is already in progress.");

        if (appointment.Status == AppointmentStatus.Completed || appointment.Status == AppointmentStatus.Cancelled)
            throw new InvalidOperationException($"Cannot change status of a {appointment.Status.ToString().ToLower()} appointment.");

        var oldStatus = appointment.Status;
        appointment.Status = request.Status;

        await context.SaveChangesAsync(cancellationToken);

        if (request.Status == AppointmentStatus.Cancelled)
        {
            var practitionerId = appointment.PractitionerId.ToString();
            var patientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}";
            var startTime = appointment.ScheduledStart.ToString("MM/dd HH:mm");

            await notificationService.SendUserNotificationAsync(
                practitionerId,
                "Appointment Cancelled",
                $"Your appointment with {patientName} on {startTime} has been cancelled.",
                NotificationPriority.High
            );
        }

        return appointment;
    }
}
