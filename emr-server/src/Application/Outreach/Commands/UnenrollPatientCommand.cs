using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Commands;

public record UnenrollPatientCommand : IRequest<bool>
{
    public Guid PatientOutreachId { get; init; }
    public string? Reason { get; init; }
}

public class UnenrollPatientCommandHandler : IRequestHandler<UnenrollPatientCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public UnenrollPatientCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<bool> Handle(UnenrollPatientCommand request, CancellationToken cancellationToken)
    {
        var outreach = await _context.PatientOutreaches
            .Include(x => x.Activities)
            .FirstOrDefaultAsync(x => x.PatientOutreachId == request.PatientOutreachId, cancellationToken);

        if (outreach == null)
        {
            throw new NotFoundException(nameof(PatientOutreach), request.PatientOutreachId);
        }

        if (outreach.Status != OutreachStatus.Enrolled || outreach.EnrolledPatientId == null)
        {
            throw new Exception("Lead is not currently enrolled.");
        }

        var patientId = outreach.EnrolledPatientId.Value;

        // 1. Deactivate Patient Record
        var patient = await _context.Patients.FindAsync(new object[] { patientId }, cancellationToken);
        if (patient != null)
        {
            patient.IsActive = false;
        }

        // 2. Close Care Navigation Cases
        var careCases = await _context.CareNavigationCases
            .Where(x => x.PatientId == patientId && x.Status == CaseStatus.Open)
            .ToListAsync(cancellationToken);

        foreach (var c in careCases)
        {
            c.Status = CaseStatus.Closed;
            c.ClosedAt = _dateTime.UtcNow;
            c.ResolutionNotes = $"Unenrolled from Outreach: {request.Reason}";
        }

        // 3. Log the Activity
        var activity = new OutreachActivity
        {
            OutreachId = outreach.PatientOutreachId,
            Method = OutreachMethod.Telephone,
            Outcome = "UNENROLLED",
            Reason = request.Reason,
            Notes = "Patient has been unenrolled and returned to Lead status.",
            ActivityDate = _dateTime.UtcNow,
            PractitionerId = (await _context.Practitioners.FirstAsync(cancellationToken)).PractitionerId
        };
        _context.OutreachActivities.Add(activity);

        // 4. Update Outreach Lead Status - Restore to Lead for re-enrollment potential
        outreach.Status = OutreachStatus.Lead;
        outreach.EnrolledPatientId = null;
        outreach.LatestActivityOutcome = "UNENROLLED";
        outreach.LatestActivityReason = request.Reason;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
