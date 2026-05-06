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
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Practitioner> GetPractitioners([Service] IApplicationDbContext context) =>
        context.Practitioners.AsNoTracking();

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Facility> GetFacilities([Service] IApplicationDbContext context) =>
        context.Facilities.AsNoTracking();

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<HealthPlan> GetHealthPlans([Service] IApplicationDbContext context) =>
        context.HealthPlans.AsNoTracking();

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Medication> GetMedications([Service] IApplicationDbContext context) =>
        context.Medications.AsNoTracking();

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Questionnaire> GetQuestionnaires([Service] IApplicationDbContext context) =>
        context.Questionnaires.AsNoTracking();

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<DurableMedicalEquipment> GetEquipment([Service] IApplicationDbContext context) =>
        context.DurableMedicalEquipment.AsNoTracking();

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<OutreachScript> GetOutreachScripts([Service] IApplicationDbContext context) =>
        context.OutreachScripts.AsNoTracking();

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<IntegrationProfile> GetIntegrationProfiles([Service] IApplicationDbContext context) =>
        context.IntegrationProfiles.AsNoTracking();
}
