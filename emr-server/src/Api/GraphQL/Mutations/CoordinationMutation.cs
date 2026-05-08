using Application.Common.Interfaces;
using Application.Coordination.Commands;
using Domain.Enums;
using HotChocolate.Authorization;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Identity;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanEditPatients")]
public class CoordinationMutation
{
    private readonly ISecurityAuditService _auditService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public CoordinationMutation(
        ISecurityAuditService auditService, 
        ICurrentUserService currentUserService,
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _auditService = auditService;
        _currentUserService = currentUserService;
        _context = context;
        _userManager = userManager;
    }

    private async Task<bool> VerifyClinicalAccess(Guid patientId, CancellationToken cancellationToken)
    {
        var userIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userIdStr)) return false;

        var user = await _userManager.FindByIdAsync(userIdStr);
        if (user?.EmergencyAccessExpiry > DateTimeOffset.UtcNow) return true;

        if (!Guid.TryParse(userIdStr, out var userId)) return false;
        
        var isAssigned = await _context.CareNavigationCases.AnyAsync(
            c => c.PatientId == patientId && c.NavigatorId == userId && c.Status == CaseStatus.Open, 
            cancellationToken);
            
        if (isAssigned) return true;

        var hasAppointment = await _context.Appointments.AnyAsync(
            a => a.PatientId == patientId && a.PractitionerId == userId, 
            cancellationToken);
            
        return hasAppointment;
    }

    public async Task<Guid> UpdateAdvanceDirective(
        UpdateAdvanceDirectiveCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(command.PatientId, cancellationToken))
            throw new UnauthorizedAccessException("Clinical assignment required for modification.");

        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync("PATIENT_DIRECTIVE_UPDATED", $"Advance directive updated: {command.Type}", command.PatientId.ToString());
        return result;
    }
}
