using Application.Clinical.Dtos;
using Application.Common.Interfaces;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class ClinicalQuery
{
    // A direct EF Core query inside the GraphQL endpoint. 
    // In a fully scaled system, this should also be moved to MediatR, but here we demonstrate
    // HotChocolate's direct IQueryable integration for high-performance projections.
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<ClinicalEncounterDto> GetEncountersByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context)
    {
        return context.ClinicalEncounters
            .AsNoTracking()
            .Where(e => e.PatientId == patientId)
            .ProjectToType<ClinicalEncounterDto>();
    }
}
