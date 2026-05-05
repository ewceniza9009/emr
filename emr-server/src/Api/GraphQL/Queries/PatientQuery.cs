using Application.Common.Interfaces;
using Application.Patients.Dtos;
using Application.Patients.Queries;
using Domain.Entities;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class PatientQuery
{
    public async Task<PatientDto?> GetPatientById(
        Guid patientId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(new GetPatientByIdQuery(patientId), cancellationToken);
    }

    public async Task<Application.Common.Models.PagedResponse<PatientDto>> GetPatients(
        [Service] IApplicationDbContext context,
        string? search = null,
        int skip = 0,
        int take = 50
    )
    {
        var query = context.Patients.AsNoTracking();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p =>
                p.FirstName.Contains(search)
                || p.LastName.Contains(search)
                || p.Mrn.Contains(search)
            );
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(p => p.LastName)
            .Skip(skip)
            .Take(take)
            .ProjectToType<PatientDto>()
            .ToListAsync();

        return new Application.Common.Models.PagedResponse<PatientDto>
        {
            Items = items,
            TotalCount = totalCount,
        };
    }

    [UseFiltering]
    [UseSorting]
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

    [UseFiltering]
    [UseSorting]
    public IQueryable<Diagnosis> GetDiagnosesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.Diagnoses.AsNoTracking().Where(x => x.PatientId == patientId);
    }

    [UseFiltering]
    [UseSorting]
    public IQueryable<Allergy> GetAllergiesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.Allergies.AsNoTracking().Where(x => x.PatientId == patientId);
    }

    [UseFiltering]
    [UseSorting]
    public IQueryable<PatientDocument> GetDocumentsByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.PatientDocuments.AsNoTracking().Where(x => x.PatientId == patientId);
    }
}
