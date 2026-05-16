using Application.Common.Interfaces;
using Application.Outreach.Commands;
using HotChocolate;
using HotChocolate.Authorization;
using HotChocolate.Types;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class OutreachMutation
{
    private readonly ISecurityAuditService _auditService;

    public OutreachMutation(ISecurityAuditService auditService)
    {
        _auditService = auditService;
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<Guid> FinalizeEnrollment(
        FinalizeEnrollmentCommand input,
        [Service] IMediator mediator
    )
    {
        var result = await mediator.Send(input);
        await _auditService.LogActionAsync(
            "PATIENT_ENROLLED",
            "Patient enrollment finalized from outreach lead.",
            result.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<bool> UnenrollPatient(
        UnenrollPatientCommand input,
        [Service] IMediator mediator
    )
    {
        var result = await mediator.Send(input);
        await _auditService.LogActionAsync(
            "PATIENT_UNENROLLED",
            "Patient unenrolled from clinical outreach program.",
            input.PatientOutreachId.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<Guid> CreateOutreach(
        CreateOutreachCommand input,
        [Service] IMediator mediator
    )
    {
        var result = await mediator.Send(input);
        await _auditService.LogActionAsync(
            "OUTREACH_LEAD_CREATED",
            $"New outreach lead created. Source: {input.ReferralSource}",
            result.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<Guid> LogOutreachActivity(
        LogOutreachActivityCommand input,
        [Service] IMediator mediator
    )
    {
        var result = await mediator.Send(input);
        await _auditService.LogActionAsync(
            "OUTREACH_ACTIVITY_LOGGED",
            $"Activity recorded for lead. Notes: {input.Notes}",
            input.OutreachId.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<Guid> AddOutreachContact(
        AddOutreachContactCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<bool> RemoveOutreachContact(
        RemoveOutreachContactCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<bool> UpdateOutreachContact(
        UpdateOutreachContactCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<bool> UpdateOutreachLead(
        UpdateOutreachLeadCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<Guid> LogSpiritualAssessment(
        LogSpiritualAssessmentCommand input,
        [Service] IMediator mediator
    )
    {
        var result = await mediator.Send(input);
        await _auditService.LogActionAsync(
            "OUTREACH_SPIRITUAL_ASSESSMENT",
            "Spiritual assessment logged for lead.",
            input.PatientId.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<Guid> AddAdvanceDirective(
        AddAdvanceDirectiveCommand input,
        [Service] IMediator mediator
    )
    {
        var result = await mediator.Send(input);
        await _auditService.LogActionAsync(
            "OUTREACH_DIRECTIVE_ADDED",
            "Advance directive captured during outreach.",
            input.PatientId.ToString()
        );
        return result;
    }
}
