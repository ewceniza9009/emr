using Application.Appointments.Dtos;
using Application.Appointments.Queries;
using MediatR;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class AppointmentQuery
{
    public async Task<List<AppointmentDto>> GetAppointmentsByPatient(
        Guid patientId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(new GetAppointmentsByPatientQuery(patientId), cancellationToken);
    }
}
