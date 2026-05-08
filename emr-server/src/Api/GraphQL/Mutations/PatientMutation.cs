using Application.Common.Interfaces;
using Application.Patients.Commands;
using Domain.Enums;
using HotChocolate.Authorization;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Identity;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanEditPatients")]
public class PatientMutation
{
    private readonly ISecurityAuditService _auditService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public PatientMutation(
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

    public async Task<Guid> CreatePatient(
        CreatePatientCommand command,
        [Service] IMediator mediator
    )
    {
        var result = await mediator.Send(command);
        await _auditService.LogActionAsync("PATIENT_RECORD_CREATED", $"New patient record initialized: {command.FirstName} {command.LastName}", result.ToString());
        return result;
    }

    public async Task<bool> UpdatePatientDemographics(
        UpdatePatientCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(command.PatientId, cancellationToken))
            throw new UnauthorizedAccessException("Clinical assignment required for modification.");

        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync("PATIENT_DEMOGRAPHICS_UPDATED", "Patient demographic data modified.", command.PatientId.ToString());
        return result;
    }

    public async Task<Guid> AddContact(
        AddContactCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(command.PatientId, cancellationToken))
            throw new UnauthorizedAccessException("Clinical assignment required for modification.");

        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync("PATIENT_CONTACT_ADDED", $"New contact added to patient record: {command.FirstName} {command.LastName}", command.PatientId.ToString());
        return result;
    }

    public async Task<bool> UpdateContact(
        UpdateContactCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var contact = await _context.PatientContacts.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ContactId == command.PatientContactId, cancellationToken);
            
        if (contact == null) throw new Exception("Contact not found.");

        if (!await VerifyClinicalAccess(contact.PatientId, cancellationToken))
            throw new UnauthorizedAccessException("Clinical assignment required for modification.");

        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync("PATIENT_CONTACT_UPDATED", $"Patient contact details modified: {command.FirstName} {command.LastName}", contact.PatientId.ToString());
        return result;
    }

    public async Task<bool> DeleteContact(
        DeleteContactCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var contact = await _context.PatientContacts.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ContactId == command.PatientContactId, cancellationToken);
            
        if (contact == null) throw new Exception("Contact not found.");

        if (!await VerifyClinicalAccess(contact.PatientId, cancellationToken))
            throw new UnauthorizedAccessException("Clinical assignment required for modification.");

        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync("PATIENT_CONTACT_REMOVED", "Contact removed from patient record.", contact.PatientId.ToString());
        return result;
    }
}
