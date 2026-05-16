using Api.GraphQL.Attributes;
using Application.Common.Interfaces;
using Application.Patients.Commands;
using Domain.Enums;
using HotChocolate.Authorization;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class PatientMutation
{
    private readonly ISecurityAuditService _auditService;

    public PatientMutation(ISecurityAuditService auditService)
    {
        _auditService = auditService;
    }

    [Authorize(Policy = "CanEditPatients")]
    public async Task<Guid> CreatePatient(
        CreatePatientCommand command,
        [Service] IMediator mediator
    )
    {
        var result = await mediator.Send(command);
        await _auditService.LogActionAsync(
            "PATIENT_RECORD_CREATED",
            $"New patient record initialized: {command.FirstName} {command.LastName}",
            result.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanEditPatients")]
    [UseClinicalAccess(argumentName: "PatientId")]
    public async Task<bool> UpdatePatientDemographics(
        UpdatePatientCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync(
            "PATIENT_DEMOGRAPHICS_UPDATED",
            "Patient demographic data modified.",
            command.PatientId.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanEditPatients")]
    [UseClinicalAccess(argumentName: "PatientId")]
    public async Task<Guid> AddContact(
        AddContactCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync(
            "PATIENT_CONTACT_ADDED",
            $"New contact added to patient record: {command.FirstName} {command.LastName}",
            command.PatientId.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanEditPatients")]
    [UseClinicalAccess(argumentName: "PatientContactId", source: ClinicalIdSource.Contact)]
    public async Task<bool> UpdateContact(
        UpdateContactCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync(
            "PATIENT_CONTACT_UPDATED",
            $"Patient contact details modified: {command.FirstName} {command.LastName}",
            command.PatientContactId.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanEditPatients")]
    [UseClinicalAccess(argumentName: "PatientContactId", source: ClinicalIdSource.Contact)]
    public async Task<bool> DeleteContact(
        DeleteContactCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync(
            "PATIENT_CONTACT_REMOVED",
            "Contact removed from patient record.",
            command.PatientContactId.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanEditPatients")]
    public async Task<bool> UpdateAdvanceDirective(
        UpdateAdvanceDirectiveCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync(
            "DIRECTIVE_UPDATED",
            "Clinical instructions for legal directive modified.",
            command.AdvanceDirectiveId.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanEditPatients")]
    public async Task<bool> RevokeAdvanceDirective(
        RevokeAdvanceDirectiveCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var result = await mediator.Send(command, cancellationToken);
        await _auditService.LogActionAsync(
            "DIRECTIVE_REVOKED",
            "Legal directive revoked from active care planning.",
            command.AdvanceDirectiveId.ToString()
        );
        return result;
    }
}
