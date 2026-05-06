using Application.Common.Interfaces;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Mutations;

[ExtendObjectType(typeof(Mutation))]
public class SetupMutation
{
    // --- Practitioner ---
    public async Task<Practitioner> CreatePractitioner(
        Practitioner input,
        [Service] IApplicationDbContext context)
    {
        context.Practitioners.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdatePractitioner(
        Practitioner input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.Practitioners.FindAsync(input.PractitionerId);
        if (existing == null) return false;

        existing.FirstName = input.FirstName;
        existing.LastName = input.LastName;
        existing.PrcLicenseNumber = input.PrcLicenseNumber;
        existing.NpiNumber = input.NpiNumber;
        existing.IsActive = input.IsActive;
        existing.Position = input.Position;
        existing.IsCareNavigator = input.IsCareNavigator;
        existing.IsSupportingClinician = input.IsSupportingClinician;

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Facility ---
    public async Task<Facility> CreateFacility(
        Facility input,
        [Service] IApplicationDbContext context)
    {
        context.Facilities.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateFacility(
        Facility input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.Facilities.FindAsync(input.FacilityId);
        if (existing == null) return false;

        existing.Name = input.Name;
        existing.Type = input.Type;

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Health Plan ---
    public async Task<HealthPlan> CreateHealthPlan(
        HealthPlan input,
        [Service] IApplicationDbContext context)
    {
        context.HealthPlans.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateHealthPlan(
        HealthPlan input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.HealthPlans.FindAsync(input.HealthPlanId);
        if (existing == null) return false;

        existing.Name = input.Name;
        existing.Code = input.Code;

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Medication ---
    public async Task<Medication> CreateMedication(
        Medication input,
        [Service] IApplicationDbContext context)
    {
        context.Medications.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateMedication(
        Medication input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.Medications.FindAsync(input.MedicationId);
        if (existing == null) return false;

        existing.Name = input.Name;
        existing.Strength = input.Strength;
        existing.DefaultRoute = input.DefaultRoute;

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Smart Phrase ---
    public async Task<SmartPhrase> CreateSmartPhrase(
        SmartPhrase input,
        [Service] IApplicationDbContext context)
    {
        context.SmartPhrases.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateSmartPhrase(
        SmartPhrase input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.SmartPhrases.FindAsync(input.PhraseId);
        if (existing == null) return false;

        existing.Shortcut = input.Shortcut;
        existing.TemplateText = input.TemplateText;
        existing.Label = input.Label;

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Questionnaire ---
    public async Task<Questionnaire> CreateQuestionnaire(
        Questionnaire input,
        [Service] IApplicationDbContext context)
    {
        context.Questionnaires.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    // --- Equipment ---
    public async Task<DurableMedicalEquipment> CreateEquipment(
        DurableMedicalEquipment input,
        [Service] IApplicationDbContext context)
    {
        context.DurableMedicalEquipment.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    // --- Outreach Script ---
    public async Task<OutreachScript> CreateOutreachScript(
        OutreachScript input,
        [Service] IApplicationDbContext context)
    {
        context.OutreachScripts.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    // --- Integration Profile ---
    public async Task<IntegrationProfile> CreateIntegrationProfile(
        IntegrationProfile input,
        [Service] IApplicationDbContext context)
    {
        context.IntegrationProfiles.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }
}
