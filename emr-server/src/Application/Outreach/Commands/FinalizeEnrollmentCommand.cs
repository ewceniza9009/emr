using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Outreach.Commands;

public record FinalizeEnrollmentCommand : IRequest<Guid>
{
    public Guid PatientOutreachId { get; init; }
    public string Modality { get; init; } = string.Empty;
    public Guid HealthPlanId { get; init; }
    public string Disposition { get; init; } = string.Empty;
    public string CommunicationStatus { get; init; } = string.Empty;
    public string TechAccess { get; init; } = string.Empty;
    public string? BarriersToCare { get; init; }
    public DateTime DateOfBirth { get; init; }
    public BiologicalSex BiologicalSex { get; init; }
    public string? GenderIdentity { get; init; }
    public string? Language { get; init; }
    public string? CivilStatus { get; init; }
    public DateTime? OrientationDate { get; init; }
    public IEnumerable<Guid> SupportingClinicianIds { get; init; } = Array.Empty<Guid>();
    public Guid? CareNavigatorId { get; init; }
    public Guid? FacilityId { get; init; }

    // Enterprise Compliance & Communication
    public bool ConsentToTreat { get; init; }
    public bool ConsentHIPAA { get; init; }
    public bool ConsentMarketing { get; init; }
    public bool InterpreterRequired { get; init; }
    public string? PreferredContactMethod { get; init; }
    public bool HasPoa { get; init; }
    public bool HasAdvanceDirective { get; init; }
    public bool ScheduleIntakeNow { get; init; }
    public int DurationMinutes { get; init; }
}

public class FinalizeEnrollmentCommandHandler : IRequestHandler<FinalizeEnrollmentCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IMrnGenerator _mrnGenerator;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ISchedulingService _schedulingService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<FinalizeEnrollmentCommandHandler> _logger;

    public FinalizeEnrollmentCommandHandler(
        IApplicationDbContext context,
        IMrnGenerator mrnGenerator,
        IDateTimeProvider dateTimeProvider,
        ISchedulingService schedulingService,
        INotificationService notificationService,
        ILogger<FinalizeEnrollmentCommandHandler> logger
    )
    {
        _context = context;
        _mrnGenerator = mrnGenerator;
        _dateTimeProvider = dateTimeProvider;
        _schedulingService = schedulingService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Guid> Handle(
        FinalizeEnrollmentCommand request,
        CancellationToken cancellationToken
    )
    {
        _logger.LogInformation(
            "Finalizing enrollment for Outreach ID: {OutreachId}",
            request.PatientOutreachId
        );

        var outreach = await _context
            .PatientOutreaches.Include(x => x.OtherContacts)
            .FirstOrDefaultAsync(
                x => x.PatientOutreachId == request.PatientOutreachId,
                cancellationToken
            );

        if (outreach == null)
        {
            throw new NotFoundException(nameof(PatientOutreach), request.PatientOutreachId);
        }

        // 1. Generate MRN
        var mrn = await _mrnGenerator.GenerateMrnAsync(cancellationToken);

        // Validate Health Plan
        var plan = await _context.HealthPlans.FirstOrDefaultAsync(
            hp => hp.HealthPlanId == request.HealthPlanId,
            cancellationToken
        );
        if (plan == null)
        {
            throw new Application.Common.Exceptions.ValidationException(
                new List<FluentValidation.Results.ValidationFailure>
                {
                    new("HealthPlanId", "The selected Health Plan does not exist.")
                }
            );
        }
        if (plan.TenantId != outreach.TenantId)
        {
            throw new Application.Common.Exceptions.ValidationException(
                new List<FluentValidation.Results.ValidationFailure>
                {
                    new("HealthPlanId", "The selected Health Plan belongs to another organization.")
                }
            );
        }
        if (!plan.IsActive)
        {
            throw new Application.Common.Exceptions.ValidationException(
                new List<FluentValidation.Results.ValidationFailure>
                {
                    new("HealthPlanId", "The selected Health Plan is currently inactive.")
                }
            );
        }

        // 2. Create Patient Record
        var patient = Patient.CreateFromOutreach(
            outreach,
            mrn,
            request.HealthPlanId,
            _dateTimeProvider.UtcNow
        );

        // Map remaining command-specific fields
        if (
            !string.IsNullOrEmpty(request.CommunicationStatus)
            && Enum.TryParse<CommunicationAbility>(
                request.CommunicationStatus.Replace("_", ""),
                true,
                out var commStatus
            )
        )
        {
            patient.CommunicationStatus = commStatus;
        }
        else
        {
            patient.CommunicationStatus =
                outreach.CommunicationStatus ?? CommunicationAbility.Verbal;
        }

        if (
            !string.IsNullOrEmpty(request.TechAccess)
            && Enum.TryParse<TechAccessLevel>(
                request.TechAccess.Replace("_", ""),
                true,
                out var techAccess
            )
        )
        {
            patient.TechAccess = techAccess;
        }
        else
        {
            patient.TechAccess = outreach.TechAccess ?? TechAccessLevel.None;
        }

        patient.BarriersToCare = request.BarriersToCare ?? outreach.BarriersToCare;
        patient.Dob =
            request.DateOfBirth == default
                ? (outreach.DateOfBirth ?? default)
                : request.DateOfBirth;
        patient.BiologicalSex =
            request.BiologicalSex == BiologicalSex.Unknown
                ? (outreach.BiologicalSex ?? BiologicalSex.Unknown)
                : request.BiologicalSex;
        patient.GenderIdentity = request.GenderIdentity ?? outreach.GenderIdentity;
        patient.Language = request.Language ?? outreach.Language ?? "English";
        patient.CivilStatus = request.CivilStatus ?? outreach.CivilStatus;
        patient.FacilityId = request.FacilityId;

        // Map Enterprise Compliance & Communication
        patient.ConsentToTreat = request.ConsentToTreat;
        patient.ConsentHIPAA = request.ConsentHIPAA;
        patient.ConsentMarketing = request.ConsentMarketing;
        patient.InterpreterRequired = request.InterpreterRequired;
        patient.PreferredContactMethod = request.PreferredContactMethod;
        patient.HasPoa = request.HasPoa;
        patient.HasAdvanceDirective = request.HasAdvanceDirective;

        _context.Patients.Add(patient);

        // 3. Open Care Navigation Case
        var navigatorId = request.CareNavigatorId;
        if (!navigatorId.HasValue)
        {
            var navigator = await _context
                .Practitioners.Where(p => p.IsCareNavigator && p.IsActive)
                .OrderBy(p => p.PractitionerId)
                .FirstOrDefaultAsync(cancellationToken);
            navigatorId = navigator?.PractitionerId;
        }

        if (navigatorId.HasValue)
        {
            var careCase = new CareNavigationCase
            {
                PatientId = patient.PatientId,
                NavigatorId = navigatorId.Value,
                Status = CaseStatus.Open,
                OpenedAt = _dateTimeProvider.UtcNow,
                AcuityLevel = AcuityLevel.Moderate,
            };
            _context.CareNavigationCases.Add(careCase);

            // Add initial task: "Initial Clinical Assessment"
            var task = new NavigationTask
            {
                CaseId = careCase.CaseId,
                AssignedToId = navigatorId.Value,
                Description = "Initial Comprehensive Clinical Assessment & Care Plan",
                DueDate = request.OrientationDate ?? _dateTimeProvider.UtcNow.AddDays(2),
                Status = NavigationTaskStatus.Pending,
            };
            _context.NavigationTasks.Add(task);
        }

        // 4. Create Clinical Appointment (Booking) - Optional
        var appointmentPractitionerId = navigatorId;
        if (
            request.ScheduleIntakeNow
            && request.OrientationDate.HasValue
            && appointmentPractitionerId.HasValue
        )
        {
            var scheduledStart =
                request.OrientationDate.Value.Kind == DateTimeKind.Utc
                    ? request.OrientationDate.Value
                    : DateTime.SpecifyKind(request.OrientationDate.Value, DateTimeKind.Utc);
            var duration = TimeSpan.FromMinutes(
                request.DurationMinutes > 0 ? request.DurationMinutes : 60
            );
            var scheduledEnd = scheduledStart.Add(duration);
            var appointmentModality = (request.Modality ?? "HomeCare") switch
            {
                "HomeCare" => AppointmentModality.InPersonHomeVisit,
                "InPatientHospice" => AppointmentModality.InPersonFacility,
                "OutpatientClinic" => AppointmentModality.InPersonFacility,
                "VirtualCare" => AppointmentModality.TelehealthVideo,
                "HybridCare" => AppointmentModality.TelehealthAudioOnly,
                _ => AppointmentModality.InPersonHomeVisit,
            };

            // --- AUTO-ADJUST LOGIC ---
            var hasConflict = await _context.Appointments.AnyAsync(
                a =>
                    a.PractitionerId == appointmentPractitionerId.Value
                    && scheduledStart < a.ScheduledEnd
                    && scheduledEnd > a.ScheduledStart,
                cancellationToken
            );

            var tempAppointment = new Appointment
            {
                AppointmentId = Guid.NewGuid(),
                PatientId = patient.PatientId,
                Patient = patient,
                PractitionerId = appointmentPractitionerId.Value,
                ScheduledStart = scheduledStart,
                ScheduledEnd = scheduledEnd,
                Modality = appointmentModality,
            };

            bool isValidLogistics = false;
            if (!hasConflict)
            {
                var (isValid, _) = await _schedulingService.ValidateLogisticsAsync(
                    tempAppointment,
                    cancellationToken
                );
                isValidLogistics = isValid;
            }

            double distance = 0;
            double travelTime = 0;
            bool statsCalculated = false;

            if (hasConflict || !isValidLogistics)
            {
                _logger.LogInformation(
                    "Intake time {Time} has conflict or invalid logistics. Auto-adjusting...",
                    scheduledStart
                );
                var availableSlots = await _schedulingService.GetAvailableProvidersAsync(
                    scheduledStart,
                    duration,
                    appointmentModality,
                    outreach.PatientOutreachId,
                    null,
                    cancellationToken
                );

                var autoSlot = availableSlots
                    .Where(s => s.PractitionerId == appointmentPractitionerId.Value)
                    .OrderBy(s => Math.Abs((s.StartTime - scheduledStart).Ticks))
                    .FirstOrDefault();

                if (autoSlot != null)
                {
                    scheduledStart = autoSlot.StartTime.UtcDateTime;
                    scheduledEnd = autoSlot.EndTime.UtcDateTime;
                    distance = autoSlot.DistanceInMiles;
                    travelTime = autoSlot.TravelTimeInMinutes;
                    statsCalculated = true;
                    _logger.LogInformation("Auto-adjusted to {NewTime}", scheduledStart);
                }
                else
                {
                    throw new Application.Common.Exceptions.ValidationException(
                        new List<FluentValidation.Results.ValidationFailure>
                        {
                            new(
                                "OrientationDate",
                                "Unable to auto-adjust schedule: No available slots for this practitioner on this day."
                            ),
                        }
                    );
                }
            }

            var appointment = new Appointment
            {
                AppointmentId = Guid.NewGuid(),
                TenantId = patient.TenantId,
                PatientId = patient.PatientId,
                Patient = patient,
                PractitionerId = appointmentPractitionerId.Value,
                ScheduledStart = scheduledStart,
                ScheduledEnd = scheduledEnd,
                Status = AppointmentStatus.Scheduled,
                VisitType = VisitType.InitialHospiceIntake,
                Modality = appointmentModality,
                CreatedAt = _dateTimeProvider.UtcNow,
            };

            if (request.SupportingClinicianIds != null && request.SupportingClinicianIds.Any())
            {
                var clinicians = await _context
                    .Practitioners.Where(p =>
                        request.SupportingClinicianIds.Contains(p.PractitionerId)
                        && p.PractitionerId != appointmentPractitionerId.Value
                    )
                    .ToListAsync(cancellationToken);
                foreach (var clinician in clinicians)
                {
                    appointment.SupportingClinicians.Add(clinician);
                }
            }

            _context.Appointments.Add(appointment);

            if (!statsCalculated)
            {
                var (recalculatedDistance, recalculatedTravelTime) =
                    await _schedulingService.RecalculateAppointmentStatsAsync(
                        appointment,
                        cancellationToken
                    );
                distance = recalculatedDistance;
                travelTime = recalculatedTravelTime;
            }

            appointment.DistanceInMiles = distance;
            appointment.TravelTimeMinutes = travelTime;
        }

        // 5. Update Outreach Lead
        outreach.Status = OutreachStatus.Enrolled;
        outreach.EnrolledPatientId = patient.PatientId;

        if (
            !string.IsNullOrEmpty(request.Modality)
            && Enum.TryParse<CareModality>(
                request.Modality.Replace("_", ""),
                true,
                out var modality
            )
        )
        {
            outreach.SelectedModality = modality;
        }

        outreach.HealthPlanId = request.HealthPlanId;

        if (
            !string.IsNullOrEmpty(request.Disposition)
            && Enum.TryParse<EnrollmentDisposition>(
                request.Disposition.Replace("_", ""),
                true,
                out var disposition
            )
        )
        {
            outreach.Disposition = disposition;
        }

        if (
            !string.IsNullOrEmpty(request.CommunicationStatus)
            && Enum.TryParse<CommunicationAbility>(
                request.CommunicationStatus.Replace("_", ""),
                true,
                out var outreachCommStatus
            )
        )
        {
            outreach.CommunicationStatus = outreachCommStatus;
        }

        if (
            !string.IsNullOrEmpty(request.TechAccess)
            && Enum.TryParse<TechAccessLevel>(
                request.TechAccess.Replace("_", ""),
                true,
                out var outreachTechAccess
            )
        )
        {
            outreach.TechAccess = outreachTechAccess;
        }

        outreach.BarriersToCare = request.BarriersToCare;
        outreach.UpdatedAt = _dateTimeProvider.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Notify Care Team
        var notificationTasks = new List<Task>();

        if (navigatorId.HasValue)
        {
            notificationTasks.Add(
                _notificationService.SendUserNotificationAsync(
                    navigatorId.Value.ToString(),
                    "New Patient Assigned",
                    $"You have been assigned as the Care Navigator for {patient.FirstName} {patient.LastName} (MRN: {mrn}).",
                    NotificationPriority.High
                )
            );
        }

        if (request.SupportingClinicianIds != null)
        {
            foreach (var clinicianId in request.SupportingClinicianIds)
            {
                if (clinicianId != navigatorId)
                {
                    notificationTasks.Add(
                        _notificationService.SendUserNotificationAsync(
                            clinicianId.ToString(),
                            "New Patient Onboarding",
                            $"Patient {patient.FirstName} {patient.LastName} (MRN: {mrn}) has been enrolled and assigned to you.",
                            NotificationPriority.High
                        )
                    );
                }
            }
        }

        notificationTasks.Add(
            _notificationService.SendGlobalNotificationAsync(
                "Patient Enrolled",
                $"New patient {patient.FirstName} {patient.LastName} has been successfully enrolled with MRN: {mrn}.",
                NotificationPriority.Normal,
                "Enrollment",
                $"/dashboard/patients/{patient.PatientId}"
            )
        );

        await Task.WhenAll(notificationTasks);

        _logger.LogInformation(
            "Successfully enrolled patient and opened care case. MRN: {MRN}, Patient ID: {PatientId}",
            mrn,
            patient.PatientId
        );

        return patient.PatientId;
    }
}
