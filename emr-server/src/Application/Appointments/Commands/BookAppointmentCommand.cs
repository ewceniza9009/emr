using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record BookAppointmentCommand(
    Guid PatientId,
    Guid PractitionerId,
    List<Guid> SupportingPractitionerIds,
    DateTimeOffset ScheduledStart,
    DateTimeOffset ScheduledEnd,
    AppointmentModality Modality,
    double? TravelTimeMinutes = null,
    double? DistanceInMiles = null,
    List<AssessmentType>? PlannedAssessments = null,
    Guid? AppointmentId = null
) : IRequest<Appointment>;

public class BookAppointmentCommandHandler(IApplicationDbContext context, ISchedulingService schedulingService)
    : IRequestHandler<BookAppointmentCommand, Appointment>
{
    public async Task<Appointment> Handle(
        BookAppointmentCommand request,
        CancellationToken cancellationToken
    )
    {
        // --- COLLISION PROOF GUARD ---
        // Check for any overlapping appointments for the same practitioner
        var hasConflict = await context.Appointments
            .AnyAsync(a => a.PractitionerId == request.PractitionerId 
                           && a.AppointmentId != request.AppointmentId
                           && request.ScheduledStart < a.ScheduledEnd 
                           && request.ScheduledEnd > a.ScheduledStart, 
                       cancellationToken);

        if (hasConflict)
        {
            throw new InvalidOperationException("Collision Detected: This practitioner already has an appointment scheduled during this time window.");
        }

        var supporting = await context
            .Practitioners.Where(p => request.SupportingPractitionerIds.Contains(p.PractitionerId))
            .ToListAsync(cancellationToken);

        Appointment appointment;
        bool isNew = false;
        bool needsRecalculation = false;
        
        if (request.AppointmentId.HasValue && request.AppointmentId.Value != Guid.Empty)
        {
            appointment =
                await context
                    .Appointments.Include(a => a.SupportingClinicians)
                    .FirstOrDefaultAsync(
                        a => a.AppointmentId == request.AppointmentId.Value,
                        cancellationToken
                    )
                ?? throw new KeyNotFoundException($"Appointment {request.AppointmentId} not found");

            // Check if fields that impact logistics changed
            if (appointment.ScheduledStart != request.ScheduledStart || 
                appointment.PractitionerId != request.PractitionerId ||
                appointment.Modality != request.Modality)
            {
                needsRecalculation = true;
            }

            appointment.PatientId = request.PatientId;
            appointment.PractitionerId = request.PractitionerId;
            appointment.ScheduledStart = request.ScheduledStart;
            appointment.ScheduledEnd = request.ScheduledEnd;
            appointment.Modality = request.Modality;
            appointment.SupportingClinicians = supporting;
            
            if (request.PlannedAssessments != null)
                appointment.PlannedAssessments = request.PlannedAssessments;
            
            // Only update if provided, otherwise preserve or allow recalculation
            if (request.TravelTimeMinutes.HasValue)
            {
                appointment.TravelTimeMinutes = request.TravelTimeMinutes;
                needsRecalculation = false; // User explicitly provided it
            }
            
            if (request.DistanceInMiles.HasValue)
            {
                appointment.DistanceInMiles = request.DistanceInMiles;
                needsRecalculation = false; // User explicitly provided it
            }
        }
        else
        {
            isNew = true;
            needsRecalculation = true;
            appointment = new Appointment
            {
                AppointmentId = Guid.NewGuid(),
                PatientId = request.PatientId,
                PractitionerId = request.PractitionerId,
                ScheduledStart = request.ScheduledStart,
                ScheduledEnd = request.ScheduledEnd,
                Modality = request.Modality,
                Status = AppointmentStatus.Scheduled,
                SupportingClinicians = supporting,
                PlannedAssessments = request.PlannedAssessments ?? new(),
                TravelTimeMinutes = request.TravelTimeMinutes,
                DistanceInMiles = request.DistanceInMiles,
            };
            
            if (request.TravelTimeMinutes.HasValue || request.DistanceInMiles.HasValue)
            {
                needsRecalculation = false; // User explicitly provided it
            }
            
            context.Appointments.Add(appointment);
        }

        await context.SaveChangesAsync(cancellationToken);

        // Recalculate if needed (new appointment or location-impacting change)
        if (needsRecalculation)
        {
            try 
            {
                var stats = await schedulingService.RecalculateAppointmentStatsAsync(appointment.AppointmentId, cancellationToken);
                appointment.TravelTimeMinutes = stats.travelTime;
                appointment.DistanceInMiles = stats.distance;
                await context.SaveChangesAsync(cancellationToken);
            }
            catch 
            {
                // Fallback: don't fail the whole booking if stats service is down
            }
        }

        return appointment;
    }
}
