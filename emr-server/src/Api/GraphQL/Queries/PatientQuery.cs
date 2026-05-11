using Api.GraphQL.Attributes;
using Api.GraphQL.DataLoaders;
using Application.Common.Interfaces;
using Application.Patients.Dtos;
using Application.Patients.Queries;
using Domain.Entities;
using HotChocolate.Authorization;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanViewPatients")]
public class PatientQuery
{
    [UseClinicalAccess]
    public async Task<PatientDto?> GetPatientById(
        Guid patientId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(new GetPatientByIdQuery(patientId), cancellationToken);
    }

    public async Task<Application.Common.Models.PagedResponse<PatientDto>> GetPatients(
        [Service] IMediator mediator,
        string? search = null,
        int skip = 0,
        int take = 50,
        List<string>? directiveTypes = null,
        string? biologicalSex = null,
        List<string>? visitStatuses = null,
        CancellationToken cancellationToken = default
    )
    {
        return await mediator.Send(
            new GetPatientsQuery(search, skip, take, directiveTypes, biologicalSex, visitStatuses),
            cancellationToken
        );
    }

    public async Task<IEnumerable<Prescription>> GetPrescriptionsByPatient(
        Guid patientId,
        PrescriptionsByPatientIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(patientId, cancellationToken);
    }

    public async Task<IEnumerable<Diagnosis>> GetDiagnosesByPatient(
        Guid patientId,
        DiagnosesByPatientIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(patientId, cancellationToken);
    }

    public async Task<IEnumerable<Allergy>> GetAllergiesByPatient(
        Guid patientId,
        AllergiesByPatientIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(patientId, cancellationToken);
    }

    public async Task<IEnumerable<PatientDocument>> GetDocumentsByPatient(
        Guid patientId,
        DocumentsByPatientIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(patientId, cancellationToken);
    }
}
