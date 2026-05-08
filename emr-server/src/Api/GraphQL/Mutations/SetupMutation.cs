using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using HotChocolate;
using HotChocolate.Types;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Mutations;

[ExtendObjectType(typeof(Mutation))]
[Authorize(Policy = "CanManageSetup")]
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
        var existing = await context.Practitioners
            .Include(p => p.Addresses)
            .Include(p => p.Licensures)
            .Include(p => p.ServiceAreas)
            .FirstOrDefaultAsync(p => p.PractitionerId == input.PractitionerId);
            
        if (existing == null) return false;

        existing.FirstName = input.FirstName;
        existing.LastName = input.LastName;
        existing.PrcLicenseNumber = input.PrcLicenseNumber;
        existing.NpiNumber = input.NpiNumber;
        existing.IsActive = input.IsActive;
        existing.Position = input.Position;
        existing.IsCareNavigator = input.IsCareNavigator;
        existing.IsSupportingClinician = input.IsSupportingClinician;

        // Atomic Sync of Addresses
        if (input.Addresses != null) {
            existing.Addresses.Clear();
            foreach(var addr in input.Addresses) existing.Addresses.Add(addr);
        }

        // Atomic Sync of Licensures
        if (input.Licensures != null) {
            existing.Licensures.Clear();
            foreach(var lic in input.Licensures) existing.Licensures.Add(lic);
        }

        // Atomic Sync of Service Areas (Zipcodes)
        if (input.ServiceAreas != null) {
            existing.ServiceAreas.Clear();
            foreach(var area in input.ServiceAreas) existing.ServiceAreas.Add(area);
        }

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

    public record UpdateQuestionnaireInput(
        Guid QuestionnaireId,
        string Name,
        AssessmentType AssessmentType,
        string? SchemaJson
    );

    public async Task<bool> UpdateQuestionnaire(
        UpdateQuestionnaireInput input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.Questionnaires.FindAsync(input.QuestionnaireId);
        if (existing == null) return false;
        existing.Name = input.Name;
        existing.AssessmentType = input.AssessmentType;
        existing.SchemaJson = input.SchemaJson;
        await context.SaveChangesAsync(default);
        return true;
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

    public async Task<bool> UpdateEquipment(
        DurableMedicalEquipment input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.DurableMedicalEquipment.FindAsync(input.EquipmentId);
        if (existing == null) return false;
        existing.ModelName = input.ModelName;
        existing.SerialNumber = input.SerialNumber;
        existing.Type = input.Type;
        existing.Status = input.Status;
        await context.SaveChangesAsync(default);
        return true;
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

    public async Task<bool> UpdateOutreachScript(
        OutreachScript input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.OutreachScripts.FindAsync(input.OutreachScriptId);
        if (existing == null) return false;
        existing.ScriptTitle = input.ScriptTitle;
        existing.LocationName = input.LocationName;
        existing.Content = input.Content;
        await context.SaveChangesAsync(default);
        return true;
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

    public async Task<bool> UpdateIntegrationProfile(
        IntegrationProfile input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.IntegrationProfiles.FindAsync(input.IntegrationProfileId);
        if (existing == null) return false;
        existing.Partner = input.Partner;
        existing.ApiKey = input.ApiKey;
        existing.BaseUrl = input.BaseUrl;
        existing.IsActive = input.IsActive;
        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Delete Mutations ---
    public async Task<bool> DeletePractitioner(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.Practitioners.FindAsync(id);
        if (item == null) return false;
        context.Practitioners.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteFacility(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.Facilities.FindAsync(id);
        if (item == null) return false;
        context.Facilities.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteHealthPlan(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.HealthPlans.FindAsync(id);
        if (item == null) return false;
        context.HealthPlans.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteMedication(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.Medications.FindAsync(id);
        if (item == null) return false;
        context.Medications.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteSmartPhrase(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.SmartPhrases.FindAsync(id);
        if (item == null) return false;
        context.SmartPhrases.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteQuestionnaire(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.Questionnaires.FindAsync(id);
        if (item == null) return false;
        context.Questionnaires.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteEquipment(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.DurableMedicalEquipment.FindAsync(id);
        if (item == null) return false;
        context.DurableMedicalEquipment.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteOutreachScript(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.OutreachScripts.FindAsync(id);
        if (item == null) return false;
        context.OutreachScripts.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteIntegrationProfile(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.IntegrationProfiles.FindAsync(id);
        if (item == null) return false;
        context.IntegrationProfiles.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Tenant Configuration ---
    public record UpdateTenantConfigurationInput(
        Guid TenantId,
        string OrganizationName,
        string Currency,
        string Timezone,
        string Language,
        string DateFormat,
        bool IsActive,
        string? ContactEmail,
        string? ExtendedSettingsJson
    );

    public async Task<bool> UpdateTenantConfiguration(
        UpdateTenantConfigurationInput input,
        [Service] IApplicationDbContext context)
    {
        var existing = await context.TenantConfigurations
            .FirstOrDefaultAsync(t => t.TenantId == input.TenantId);
            
        if (existing == null) return false;

        existing.OrganizationName = input.OrganizationName;
        existing.Currency = input.Currency;
        existing.Timezone = input.Timezone;
        existing.Language = input.Language;
        existing.DateFormat = input.DateFormat;
        existing.IsActive = input.IsActive;
        existing.ContactEmail = input.ContactEmail;
        existing.ExtendedSettingsJson = input.ExtendedSettingsJson;

        await context.SaveChangesAsync(default);
        return true;
    }
}
