using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Commands;

public record FinalizeEnrollmentCommand : IRequest<Guid>
{
    public Guid PatientOutreachId { get; init; }
    public CareModality Modality { get; init; }
    public Guid HealthPlanId { get; init; }
}

public class FinalizeEnrollmentCommandHandler : IRequestHandler<FinalizeEnrollmentCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public FinalizeEnrollmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(FinalizeEnrollmentCommand request, CancellationToken cancellationToken)
    {
        var outreach = await _context.PatientOutreaches
            .FirstOrDefaultAsync(x => x.PatientOutreachId == request.PatientOutreachId, cancellationToken);

        if (outreach == null) throw new Exception("Outreach lead not found");

        // 1. Generate MRN (Simplified for demo: PN-YYYY-RANDOM)
        var mrn = $"PN-{DateTime.Now.Year}-{new Random().Next(1000, 9999)}";

        // 2. Create Patient Record
        var patient = new Patient
        {
            Mrn = mrn,
            FirstName = outreach.FirstName,
            LastName = outreach.LastName,
            City = outreach.City,
            HealthPlanId = request.HealthPlanId,
            CommunicationStatus = outreach.CommunicationStatus,
            TechAccess = outreach.TechAccess,
            BarriersToCare = outreach.BarriersToCare,
            CreatedAt = DateTime.UtcNow
        };

        _context.Patients.Add(patient);

        // 3. Update Outreach Lead
        outreach.Status = OutreachStatus.Enrolled;
        outreach.EnrolledPatientId = patient.PatientId;
        outreach.SelectedModality = request.Modality;
        outreach.HealthPlanId = request.HealthPlanId;

        await _context.SaveChangesAsync(cancellationToken);

        return patient.PatientId;
    }
}
