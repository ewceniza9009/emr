using Api.GraphQL.Attributes;
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
        CancellationToken cancellationToken = default
    )
    {
        return await mediator.Send(new GetPatientsQuery(search, skip, take), cancellationToken);
    }

    public IQueryable<Prescription> GetPrescriptionsByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context
            .Prescriptions.Include(x => x.Medication)
            .AsNoTracking()
            .Where(x => x.PatientId == patientId);
    }

    public IQueryable<Diagnosis> GetDiagnosesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.Diagnoses.AsNoTracking().Where(x => x.PatientId == patientId);
    }

    public IQueryable<Allergy> GetAllergiesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.Allergies.AsNoTracking().Where(x => x.PatientId == patientId);
    }

    public IQueryable<PatientDocument> GetDocumentsByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.PatientDocuments.AsNoTracking().Where(x => x.PatientId == patientId);
    }
}
