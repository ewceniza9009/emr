using Application.Clinical.Commands;
using Application.Patients.Commands;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class ClinicalMutation
{
    public async Task<Guid> CreateClinicalEncounter(
        CreateClinicalEncounterCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> LogVitalSign(
        LogVitalSignCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> LogEsasAssessment(
        LogEsasAssessmentCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> CompleteGuidedEncounter(
        CompleteGuidedEncounterCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> SaveClinicalNote(
        SaveClinicalNoteCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> AddAllergy(
        AddAllergyCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> AddPrescription(
        AddPrescriptionCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }
}
