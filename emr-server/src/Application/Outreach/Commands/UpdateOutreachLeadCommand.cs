using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Commands;

public record UpdateOutreachLeadCommand : IRequest<bool>
{
    public Guid PatientOutreachId { get; init; }
    public string? Modality { get; init; }
    public Guid? HealthPlanId { get; init; }
    public string? Disposition { get; init; }
    public string? CommunicationStatus { get; init; }
    public string? TechAccess { get; init; }
    public string? BarriersToCare { get; init; }
}

public class UpdateOutreachLeadCommandHandler : IRequestHandler<UpdateOutreachLeadCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateOutreachLeadCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateOutreachLeadCommand request, CancellationToken cancellationToken)
    {
        var outreach = await _context.PatientOutreaches
            .FirstOrDefaultAsync(x => x.PatientOutreachId == request.PatientOutreachId, cancellationToken);

        if (outreach == null)
        {
            return false;
        }

        if (request.Modality != null)
            outreach.SelectedModality = Enum.Parse<CareModality>(request.Modality.Replace("_", ""), true);
        
        if (request.HealthPlanId != null)
            outreach.HealthPlanId = request.HealthPlanId.Value;
            
        if (request.Disposition != null)
            outreach.Disposition = Enum.Parse<EnrollmentDisposition>(request.Disposition.Replace("_", ""), true);
            
        if (request.CommunicationStatus != null)
            outreach.CommunicationStatus = Enum.Parse<CommunicationAbility>(request.CommunicationStatus.Replace("_", ""), true);
            
        if (request.TechAccess != null)
            outreach.TechAccess = Enum.Parse<TechAccessLevel>(request.TechAccess.Replace("_", ""), true);
            
        if (request.BarriersToCare != null)
            outreach.BarriersToCare = request.BarriersToCare;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
