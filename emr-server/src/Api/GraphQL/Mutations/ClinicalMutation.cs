using Application.Clinical.Commands;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class ClinicalMutation
{
    public async Task<Guid> CreateClinicalEncounter(
        CreateClinicalEncounterCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> LogVitalSign(
        LogVitalSignCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> LogEsasAssessment(
        LogEsasAssessmentCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> CompleteGuidedEncounter(
        CompleteGuidedEncounterCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> SaveClinicalNote(
        SaveClinicalNoteCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(command, cancellationToken);
    }
}
