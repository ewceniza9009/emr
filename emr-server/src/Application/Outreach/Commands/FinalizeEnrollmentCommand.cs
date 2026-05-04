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
}

public class FinalizeEnrollmentCommandHandler : IRequestHandler<FinalizeEnrollmentCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IMrnGenerator _mrnGenerator;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<FinalizeEnrollmentCommandHandler> _logger;

    public FinalizeEnrollmentCommandHandler(
        IApplicationDbContext context,
        IMrnGenerator mrnGenerator,
        IDateTimeProvider dateTimeProvider,
        ILogger<FinalizeEnrollmentCommandHandler> logger
    )
    {
        _context = context;
        _mrnGenerator = mrnGenerator;
        _dateTimeProvider = dateTimeProvider;
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

        // 2. Create Patient Record
        var patient = Patient.CreateFromOutreach(
            outreach,
            mrn,
            request.HealthPlanId,
            _dateTimeProvider.UtcNow
        );

        // Map remaining command-specific fields
        patient.CommunicationStatus = Enum.Parse<CommunicationAbility>(
            request.CommunicationStatus,
            true
        );
        patient.TechAccess = Enum.Parse<TechAccessLevel>(request.TechAccess, true);
        patient.BarriersToCare = request.BarriersToCare;

        _context.Patients.Add(patient);

        // 3. Update Outreach Lead
        outreach.Status = OutreachStatus.Enrolled;
        outreach.EnrolledPatientId = patient.PatientId;
        outreach.SelectedModality = Enum.Parse<CareModality>(request.Modality, true);
        outreach.HealthPlanId = request.HealthPlanId;
        outreach.Disposition = Enum.Parse<EnrollmentDisposition>(request.Disposition, true);
        outreach.CommunicationStatus = Enum.Parse<CommunicationAbility>(
            request.CommunicationStatus,
            true
        );
        outreach.TechAccess = Enum.Parse<TechAccessLevel>(request.TechAccess, true);
        outreach.BarriersToCare = request.BarriersToCare;
        outreach.UpdatedAt = _dateTimeProvider.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Successfully enrolled patient. MRN: {MRN}, Patient ID: {PatientId}",
            mrn,
            patient.PatientId
        );

        return patient.PatientId;
    }
}
