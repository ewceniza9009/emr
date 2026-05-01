using Application.Patients.Dtos;
using Application.Patients.Queries;
using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class PatientQuery
{
    public async Task<PatientDto?> GetPatientById(
        Guid patientId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(new GetPatientByIdQuery(patientId), cancellationToken);
    }

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public async Task<IEnumerable<PatientDto>> GetPatients(
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(new GetPatientsQuery(), cancellationToken);
    }

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Prescription> GetPrescriptionsByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context)
    {
        return context.Prescriptions
            .Include(x => x.Medication)
            .AsNoTracking()
            .Where(x => x.PatientId == patientId);
    }
}
