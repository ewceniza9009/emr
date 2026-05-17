using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Clinical.Commands;

public class CreateClinicalEncounterCommandHandler
    : IRequestHandler<CreateClinicalEncounterCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;
    private readonly INotificationService _notificationService;
    private readonly ILogger<CreateClinicalEncounterCommandHandler> _logger;

    public CreateClinicalEncounterCommandHandler(
        IApplicationDbContext context,
        IDateTimeProvider dateTime,
        INotificationService notificationService,
        ILogger<CreateClinicalEncounterCommandHandler> logger
    )
    {
        _context = context;
        _dateTime = dateTime;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Guid> Handle(
        CreateClinicalEncounterCommand request,
        CancellationToken cancellationToken
    )
    {
        var practitionerId = request.PractitionerId;
        var practitionerExists = await _context.Practitioners
            .AnyAsync(p => p.PractitionerId == practitionerId, cancellationToken);

        if (!practitionerExists)
        {
            // Resolve from UserId if a user ID was passed
            var practitionerByUserId = await _context.Practitioners
                .FirstOrDefaultAsync(p => p.UserId == practitionerId, cancellationToken);

            if (practitionerByUserId != null)
            {
                _logger.LogWarning(
                    "Clinical Identity Mapped: Practitioner record '{ResolvedId}' resolved from incoming User ID '{UserId}' during encounter initialization.",
                    practitionerByUserId.PractitionerId,
                    practitionerId
                );
                practitionerId = practitionerByUserId.PractitionerId;
            }
            else
            {
                // Fallback to first active practitioner to prevent FK violation
                var defaultPractitioner = await _context.Practitioners
                    .FirstOrDefaultAsync(p => p.IsActive, cancellationToken);

                if (defaultPractitioner != null)
                {
                    _logger.LogCritical(
                        "Clinical Identity RESOLUTION FAILURE: Could not resolve practitioner record for incoming ID '{IncomingId}' during encounter initialization. " +
                        "Encounter silently attributed to active default practitioner '{DefaultId}' to prevent foreign-key database crash. " +
                        "AUDIT TRAIL CORRUPTED - MANUAL INTERVENTION REQUIRED.",
                        request.PractitionerId,
                        defaultPractitioner.PractitionerId
                    );
                    practitionerId = defaultPractitioner.PractitionerId;
                }
            }
        }

        var encounter = new ClinicalEncounter
        {
            EncounterId = Guid.NewGuid(),
            PatientId = request.PatientId,
            PractitionerId = practitionerId,
            AppointmentId = request.AppointmentId,
            Status = EncounterStatus.InProgress,
            AdmittedAt = _dateTime.UtcNow,
            ChiefComplaint = request.ChiefComplaint,
            PpsScore = request.PpsScore,
        };

        // Create the initial clinical note
        var note = new ClinicalNote
        {
            NoteId = Guid.NewGuid(),
            EncounterId = encounter.EncounterId,
            AuthorId = practitionerId,
            Content = request.Notes,
            CreatedAt = _dateTime.UtcNow,
            IsSigned = false,
            Type = NoteType.Progress,
        };

        _context.ClinicalEncounters.Add(encounter);
        _context.ClinicalNotes.Add(note);

        // Update linked appointment status
        if (request.AppointmentId.HasValue)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId.Value, cancellationToken);
            if (appointment != null)
            {
                appointment.Status = AppointmentStatus.InProgress;
            }
        }

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId, cancellationToken);
        var patientName = patient != null ? $"{patient.FirstName} {patient.LastName}" : "Unknown Patient";

        await _context.SaveChangesAsync(cancellationToken);

        // Notify Visit Started
        await _notificationService.SendGlobalNotificationAsync(
            "Visit Started",
            $"Practitioner has started a guided encounter with {patientName}.",
            NotificationPriority.Normal
        );

        return encounter.EncounterId;
    }
}
