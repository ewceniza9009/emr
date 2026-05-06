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
    public IQueryable<Practitioner> GetPractitioners([Service] IApplicationDbContext context) =>
        context.Practitioners.AsNoTracking();

    [UseFiltering]
    [UseSorting]
    public IQueryable<Facility> GetFacilities([Service] IApplicationDbContext context) =>
        context.Facilities.AsNoTracking();

    [UseFiltering]
    [UseSorting]
    public IQueryable<HealthPlan> GetHealthPlans([Service] IApplicationDbContext context) =>
        context.HealthPlans.AsNoTracking();

    [UseFiltering]
    [UseSorting]
    public IQueryable<Medication> GetMedications([Service] IApplicationDbContext context) =>
        context.Medications.AsNoTracking();

    [UseFiltering]
    [UseSorting]
    public IQueryable<Questionnaire> GetQuestionnaires([Service] IApplicationDbContext context) =>
        context.Questionnaires.Include(x => x.Questions).AsNoTracking();

    [UseFiltering]
    [UseSorting]
    public IQueryable<DurableMedicalEquipment> GetEquipment([Service] IApplicationDbContext context) =>
        context.DurableMedicalEquipment.AsNoTracking();

    [UseFiltering]
    [UseSorting]
    public IQueryable<OutreachScript> GetOutreachScripts([Service] IApplicationDbContext context) =>
        context.OutreachScripts.AsNoTracking();

    [UseFiltering]
    [UseSorting]
    public IQueryable<IntegrationProfile> GetIntegrationProfiles([Service] IApplicationDbContext context) =>
        context.IntegrationProfiles.AsNoTracking();
}
