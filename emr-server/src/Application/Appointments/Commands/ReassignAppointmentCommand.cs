using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record ReassignAppointmentCommand(Guid AppointmentId, Guid PractitionerId, bool OverrideLogistics = false)
    : IRequest<Appointment>;

public class ReassignAppointmentCommandHandler
    : IRequestHandler<ReassignAppointmentCommand, Appointment>
{
    private readonly IApplicationDbContext _context;
    private readonly ISchedulingService _schedulingService;
    private readonly INotificationService _notificationService;

    public ReassignAppointmentCommandHandler(
        IApplicationDbContext context,
        ISchedulingService schedulingService,
        INotificationService notificationService
    )
    {
        _context = context;
        _schedulingService = schedulingService;
        _notificationService = notificationService;
    }

    public async Task<Appointment> Handle(ReassignAppointmentCommand request, CancellationToken ct)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var appointment = await _context
                .Appointments.Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId, ct);

            if (appointment == null)
                throw new KeyNotFoundException("Appointment not found");

            var oldPractitionerId = appointment.PractitionerId;
            appointment.PractitionerId = request.PractitionerId;

            // Final validation before commit
            if (!request.OverrideLogistics)
            {
                var (isValid, reason) = await _schedulingService.ValidateLogisticsAsync(appointment, ct);
                if (!isValid)
                {
                    appointment.PractitionerId = oldPractitionerId; // Rollback entity state
                    throw new InvalidOperationException(reason);
                }
            }

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            var practitioner = await _context.Practitioners.FindAsync(
                new object[] { request.PractitionerId },
                ct
            );
            if (practitioner != null)
            {
                await _notificationService.SendUserNotificationAsync(
                    practitioner.UserId.ToString(),
                    "New Appointment Assigned",
                    $"You have been assigned a new appointment for {appointment.Patient.FullName} at {appointment.ScheduledStart:f}.",
                    NotificationPriority.High,
                    "Scheduling"
                );
            }

            return appointment;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}
