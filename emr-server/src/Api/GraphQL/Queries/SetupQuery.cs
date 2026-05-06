using Application.Common.Interfaces;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Data;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class SetupQuery
{
    [UseFiltering]
    [UseSorting]
    public async Task<List<Practitioner>> GetPractitioners([Service] IApplicationDbContext context)
    {
        return await context.Practitioners.AsNoTracking().ToListAsync();
    }

    [UseFiltering]
    [UseSorting]
    public async Task<List<Facility>> GetFacilities([Service] IApplicationDbContext context) =>
        await context.Facilities.AsNoTracking().ToListAsync();

    [UseFiltering]
    [UseSorting]
    public async Task<List<HealthPlan>> GetHealthPlans([Service] IApplicationDbContext context) =>
        await context.HealthPlans.AsNoTracking().ToListAsync();

    [UseFiltering]
    [UseSorting]
    public async Task<List<Medication>> GetMedications([Service] IApplicationDbContext context) =>
        await context.Medications.AsNoTracking().ToListAsync();

    [UseFiltering]
    [UseSorting]
    public async Task<List<Questionnaire>> GetQuestionnaires([Service] IApplicationDbContext context) =>
        await context.Questionnaires.AsNoTracking().ToListAsync();

    [UseFiltering]
    [UseSorting]
    public async Task<List<DurableMedicalEquipment>> GetEquipment([Service] IApplicationDbContext context) =>
        await context.DurableMedicalEquipment.AsNoTracking().ToListAsync();

    [UseFiltering]
    [UseSorting]
    public async Task<List<OutreachScript>> GetOutreachScripts([Service] IApplicationDbContext context) =>
        await context.OutreachScripts.AsNoTracking().ToListAsync();

    [UseFiltering]
    [UseSorting]
    public async Task<List<IntegrationProfile>> GetIntegrationProfiles([Service] IApplicationDbContext context) =>
        await context.IntegrationProfiles.AsNoTracking().ToListAsync();
}
