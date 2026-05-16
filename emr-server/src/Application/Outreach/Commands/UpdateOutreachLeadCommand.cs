using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Commands;

public record UpdateOutreachLeadCommand : IRequest<bool>
{
    public Guid PatientOutreachId { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? GenderIdentity { get; init; }
    public string? BiologicalSex { get; init; }
    public string? ReferralSource { get; init; }
    public string? Status { get; init; }
    public string? Notes { get; init; }

    // Mailing Address
    public string? Street { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? PostalCode { get; init; }

    public string? Modality { get; init; }
    public Guid? HealthPlanId { get; init; }
    public string? Disposition { get; init; }
    public string? CommunicationStatus { get; init; }
    public string? TechAccess { get; init; }
    public string? BarriersToCare { get; init; }
    public string? PreferredContactTime { get; init; }
    public string? PrimaryPhone { get; init; }
    public string? PrimaryEmail { get; init; }
}

public class UpdateOutreachLeadCommandHandler : IRequestHandler<UpdateOutreachLeadCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateOutreachLeadCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(
        UpdateOutreachLeadCommand request,
        CancellationToken cancellationToken
    )
    {
        var outreach = await _context.PatientOutreaches.FirstOrDefaultAsync(
            x => x.PatientOutreachId == request.PatientOutreachId,
            cancellationToken
        );

        if (outreach == null)
        {
            return false;
        }

        if (request.FirstName != null)
            outreach.FirstName = request.FirstName;
        if (request.LastName != null)
            outreach.LastName = request.LastName;
        if (request.GenderIdentity != null)
            outreach.GenderIdentity = request.GenderIdentity;
        if (request.BiologicalSex != null)
            outreach.BiologicalSex = Enum.Parse<BiologicalSex>(
                request.BiologicalSex.Replace("_", ""),
                true
            );
        if (request.ReferralSource != null)
            outreach.ReferralSource = request.ReferralSource;
        if (request.Status != null)
            outreach.Status = Enum.Parse<OutreachStatus>(request.Status.Replace("_", ""), true);
        if (request.Notes != null)
            outreach.Notes = request.Notes;

        if (request.Street != null)
            outreach.MailingAddress.Street = request.Street;
        if (request.City != null)
            outreach.MailingAddress.City = request.City;
        if (request.State != null)
            outreach.MailingAddress.State = request.State;
        if (request.PostalCode != null)
            outreach.MailingAddress.PostalCode = request.PostalCode;

        if (request.Modality != null)
            outreach.SelectedModality = Enum.Parse<CareModality>(
                request.Modality.Replace("_", ""),
                true
            );

        if (request.HealthPlanId != null)
            outreach.HealthPlanId = request.HealthPlanId.Value;

        if (request.Disposition != null)
            outreach.Disposition = Enum.Parse<EnrollmentDisposition>(
                request.Disposition.Replace("_", ""),
                true
            );

        if (request.CommunicationStatus != null)
            outreach.CommunicationStatus = Enum.Parse<CommunicationAbility>(
                request.CommunicationStatus.Replace("_", ""),
                true
            );

        if (request.TechAccess != null)
            outreach.TechAccess = Enum.Parse<TechAccessLevel>(
                request.TechAccess.Replace("_", ""),
                true
            );

        if (request.BarriersToCare != null)
            outreach.BarriersToCare = request.BarriersToCare;

        if (request.PreferredContactTime != null)
            outreach.PreferredContactTime = request.PreferredContactTime;

        if (request.PrimaryPhone != null)
            outreach.PrimaryPhone = request.PrimaryPhone;

        if (request.PrimaryEmail != null)
            outreach.PrimaryEmail = request.PrimaryEmail;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
