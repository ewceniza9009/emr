using Application.Patients.Dtos;
using Application.Patients.Queries;
using MediatR;

namespace Api.GraphQL.Queries;

[QueryType]
public class PatientQuery
{
    public async Task<PatientDto?> GetPatientById(
        Guid patientId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(new GetPatientByIdQuery(patientId), cancellationToken);
    }
}
