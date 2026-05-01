using Application.Patients.Commands;
using MediatR;

namespace Api.GraphQL.Mutations;

[MutationType]
public class PatientMutation
{
    public async Task<Guid> CreatePatient(
        CreatePatientCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(input, cancellationToken);
    }
}
