using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using HotChocolate;
using HotChocolate.Authorization;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Mutations;

[ExtendObjectType(typeof(Mutation))]
[Authorize(Policy = "CanManageSetup")]
public class SetupMutation
{
    // --- Practitioner ---
    public async Task<Practitioner> CreatePractitioner(
        Practitioner input,
        [Service] IApplicationDbContext context,
        [Service]
            Microsoft.AspNetCore.Identity.UserManager<Infrastructure.Identity.ApplicationUser> userManager,
        [Service] INotificationService notificationService
    )
    {
        // SELF-HEALING: If UserId is missing, try to find a user with the same name
        if (input.UserId == Guid.Empty)
        {
            var users = await userManager
                .Users.Where(u => u.FirstName == input.FirstName && u.LastName == input.LastName)
                .ToListAsync();

            if (users.Count == 1)
            {
                input.UserId = Guid.Parse(users[0].Id);
            }
            else
            {
                throw new GraphQLException(
                    users.Count > 1
                        ? "Ambiguous identity detected: Multiple users found with this name. Please provide an explicit UserId."
                        : "No system identity found for this name. A user account must be created before registering a practitioner."
                );
            }
        }

        context.Practitioners.Add(input);
        await context.SaveChangesAsync(default);

        // Notify Onboarding
        await notificationService.SendGlobalNotificationAsync(
            "New Practitioner Onboarded",
            $"{input.FirstName} {input.LastName} ({input.Position}) has been registered and is now active in the clinical directory.",
            NotificationPriority.Normal,
            category: "System",
            actionUrl: "/admin/practitioners"
        );

        return input;
    }

    public async Task<bool> UpdatePractitioner(
        Practitioner input,
        [Service] IApplicationDbContext context
    )
    {
        var db = (DbContext)context;
        var existing = await context
            .Practitioners.Include(p => p.Addresses)
            .Include(p => p.Licensures)
            .Include(p => p.ServiceAreas)
            .FirstOrDefaultAsync(p => p.PractitionerId == input.PractitionerId);

        if (existing == null)
            return false;

        // PROTECT IDENTITY: Only update UserId if a non-empty Guid is provided
        if (input.UserId != Guid.Empty)
            existing.UserId = input.UserId;

        existing.FirstName = input.FirstName;
        existing.LastName = input.LastName;
        existing.PrcLicenseNumber = input.PrcLicenseNumber;
        existing.NpiNumber = input.NpiNumber;
        existing.IsActive = input.IsActive;
        existing.Position = input.Position;
        existing.IsCareNavigator = input.IsCareNavigator;
        existing.IsSupportingClinician = input.IsSupportingClinician;

        // Atomic Sync of Addresses
        if (input.Addresses != null)
        {
            var inputIds = input.Addresses.Select(a => a.EntityAddressId).ToList();
            var toRemove = existing
                .Addresses.Where(a => !inputIds.Contains(a.EntityAddressId))
                .ToList();
            foreach (var r in toRemove)
                existing.Addresses.Remove(r);

            foreach (var addr in input.Addresses)
            {
                var existingAddr = existing.Addresses.FirstOrDefault(a =>
                    a.EntityAddressId == addr.EntityAddressId
                );
                if (existingAddr != null)
                {
                    db.Entry(existingAddr).CurrentValues.SetValues(addr);
                }
                else
                {
                    existing.Addresses.Add(addr);
                }
            }
        }

        // Atomic Sync of Licensures
        if (input.Licensures != null)
        {
            var inputIds = input.Licensures.Select(l => l.LicensureId).ToList();
            var toRemove = existing
                .Licensures.Where(l => !inputIds.Contains(l.LicensureId))
                .ToList();
            foreach (var r in toRemove)
                existing.Licensures.Remove(r);

            foreach (var lic in input.Licensures)
            {
                var existingLic = existing.Licensures.FirstOrDefault(l =>
                    l.LicensureId == lic.LicensureId
                );
                if (existingLic != null)
                {
                    db.Entry(existingLic).CurrentValues.SetValues(lic);
                }
                else
                {
                    existing.Licensures.Add(lic);
                }
            }
        }

        // Atomic Sync of Service Areas (Zipcodes)
        if (input.ServiceAreas != null)
        {
            var inputIds = input.ServiceAreas.Select(s => s.ServiceAreaId).ToList();
            var toRemove = existing
                .ServiceAreas.Where(s => !inputIds.Contains(s.ServiceAreaId))
                .ToList();
            foreach (var r in toRemove)
                existing.ServiceAreas.Remove(r);

            foreach (var area in input.ServiceAreas)
            {
                var existingArea = existing.ServiceAreas.FirstOrDefault(a =>
                    a.ServiceAreaId == area.ServiceAreaId
                );
                if (existingArea != null)
                {
                    db.Entry(existingArea).CurrentValues.SetValues(area);
                }
                else
                {
                    existing.ServiceAreas.Add(area);
                }
            }
        }

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Facility ---
    public async Task<Facility> CreateFacility(
        Facility input,
        [Service] IApplicationDbContext context
    )
    {
        context.Facilities.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateFacility(Facility input, [Service] IApplicationDbContext context)
    {
        var existing = await context.Facilities.FindAsync(input.FacilityId);
        if (existing == null)
            return false;

        existing.Name = input.Name;
        existing.Type = input.Type;

        if (input.FacilityAddress != null)
        {
            existing.FacilityAddress.Street = input.FacilityAddress.Street;
            existing.FacilityAddress.City = input.FacilityAddress.City;
            existing.FacilityAddress.State = input.FacilityAddress.State;
            existing.FacilityAddress.PostalCode = input.FacilityAddress.PostalCode;
            existing.FacilityAddress.Country = input.FacilityAddress.Country;
            existing.FacilityAddress.Latitude = input.FacilityAddress.Latitude;
            existing.FacilityAddress.Longitude = input.FacilityAddress.Longitude;
        }

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Health Plan ---
    public async Task<HealthPlan> CreateHealthPlan(
        HealthPlan input,
        [Service] IApplicationDbContext context
    )
    {
        context.HealthPlans.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateHealthPlan(
        HealthPlan input,
        [Service] IApplicationDbContext context
    )
    {
        var existing = await context.HealthPlans.FindAsync(input.HealthPlanId);
        if (existing == null)
            return false;

        existing.Name = input.Name;
        existing.Code = input.Code;

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Medication ---
    public async Task<Medication> CreateMedication(
        Medication input,
        [Service] IApplicationDbContext context
    )
    {
        context.Medications.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateMedication(
        Medication input,
        [Service] IApplicationDbContext context
    )
    {
        var existing = await context.Medications.FindAsync(input.MedicationId);
        if (existing == null)
            return false;

        existing.Name = input.Name;
        existing.Strength = input.Strength;
        existing.DefaultRoute = input.DefaultRoute;

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Smart Phrase ---
    public async Task<SmartPhrase> CreateSmartPhrase(
        SmartPhrase input,
        [Service] IApplicationDbContext context
    )
    {
        context.SmartPhrases.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateSmartPhrase(
        SmartPhrase input,
        [Service] IApplicationDbContext context
    )
    {
        var existing = await context.SmartPhrases.FindAsync(input.PhraseId);
        if (existing == null)
            return false;

        existing.Shortcut = input.Shortcut;
        existing.TemplateText = input.TemplateText;
        existing.Label = input.Label;

        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Questionnaire ---
    public async Task<Questionnaire> CreateQuestionnaire(
        Questionnaire input,
        [Service] IApplicationDbContext context
    )
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
        [Service] IApplicationDbContext context
    )
    {
        var existing = await context.Questionnaires.FindAsync(input.QuestionnaireId);
        if (existing == null)
            return false;
        existing.Name = input.Name;
        existing.AssessmentType = input.AssessmentType;
        existing.SchemaJson = input.SchemaJson;
        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Equipment ---
    public async Task<DurableMedicalEquipment> CreateEquipment(
        DurableMedicalEquipment input,
        [Service] IApplicationDbContext context
    )
    {
        context.DurableMedicalEquipment.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateEquipment(
        DurableMedicalEquipment input,
        [Service] IApplicationDbContext context
    )
    {
        var existing = await context.DurableMedicalEquipment.FindAsync(input.EquipmentId);
        if (existing == null)
            return false;
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
        [Service] IApplicationDbContext context
    )
    {
        context.OutreachScripts.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateOutreachScript(
        OutreachScript input,
        [Service] IApplicationDbContext context
    )
    {
        var existing = await context.OutreachScripts.FindAsync(input.OutreachScriptId);
        if (existing == null)
            return false;
        existing.ScriptTitle = input.ScriptTitle;
        existing.LocationName = input.LocationName;
        existing.Content = input.Content;
        await context.SaveChangesAsync(default);
        return true;
    }

    // --- Integration Profile ---
    public async Task<IntegrationProfile> CreateIntegrationProfile(
        IntegrationProfile input,
        [Service] IApplicationDbContext context
    )
    {
        context.IntegrationProfiles.Add(input);
        await context.SaveChangesAsync(default);
        return input;
    }

    public async Task<bool> UpdateIntegrationProfile(
        IntegrationProfile input,
        [Service] IApplicationDbContext context
    )
    {
        var existing = await context.IntegrationProfiles.FindAsync(input.IntegrationProfileId);
        if (existing == null)
            return false;
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
        if (item == null)
            return false;
        context.Practitioners.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteFacility(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.Facilities.FindAsync(id);
        if (item == null)
            return false;
        context.Facilities.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteHealthPlan(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.HealthPlans.FindAsync(id);
        if (item == null)
            return false;
        context.HealthPlans.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteMedication(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.Medications.FindAsync(id);
        if (item == null)
            return false;
        context.Medications.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteSmartPhrase(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.SmartPhrases.FindAsync(id);
        if (item == null)
            return false;
        context.SmartPhrases.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteQuestionnaire(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.Questionnaires.FindAsync(id);
        if (item == null)
            return false;
        context.Questionnaires.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteEquipment(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.DurableMedicalEquipment.FindAsync(id);
        if (item == null)
            return false;
        context.DurableMedicalEquipment.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteOutreachScript(Guid id, [Service] IApplicationDbContext context)
    {
        var item = await context.OutreachScripts.FindAsync(id);
        if (item == null)
            return false;
        context.OutreachScripts.Remove(item);
        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> DeleteIntegrationProfile(
        Guid id,
        [Service] IApplicationDbContext context
    )
    {
        var item = await context.IntegrationProfiles.FindAsync(id);
        if (item == null)
            return false;
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
        bool EnableElasticsearch,
        bool EnforceMfa,
        int SessionTimeoutMinutes,
        bool StrictOnboarding,
        string? ContactEmail,
        string? ExtendedSettingsJson,
        int? AmStartHour,
        int? PmStartHour,
        int? DayEndHour,
        int? EngineSafetyDriveMins,
        double? EngineSafetyDistKm,
        int? IotSyncIntervalMs,
        int? UrgentPainThreshold,
        int? UrgentWellbeingThreshold
    );

    public async Task<bool> UpdateTenantConfiguration(
        UpdateTenantConfigurationInput input,
        [Service] IApplicationDbContext context
    )
    {
        var existing = await context.TenantConfigurations.FirstOrDefaultAsync(t =>
            t.TenantId == input.TenantId
        );

        if (existing == null)
            return false;

        existing.OrganizationName = input.OrganizationName;
        existing.Currency = input.Currency;
        existing.Timezone = input.Timezone;
        existing.Language = input.Language;
        existing.DateFormat = input.DateFormat;
        existing.IsActive = input.IsActive;
        existing.EnableElasticsearch = input.EnableElasticsearch;
        existing.EnforceMfa = input.EnforceMfa;
        existing.SessionTimeoutMinutes = input.SessionTimeoutMinutes;
        existing.StrictOnboarding = input.StrictOnboarding;
        existing.ContactEmail = input.ContactEmail;
        existing.ExtendedSettingsJson = input.ExtendedSettingsJson;

        if (input.AmStartHour.HasValue)
            existing.AmStartHour = input.AmStartHour.Value;
        if (input.PmStartHour.HasValue)
            existing.PmStartHour = input.PmStartHour.Value;
        if (input.DayEndHour.HasValue)
            existing.DayEndHour = input.DayEndHour.Value;
        if (input.EngineSafetyDriveMins.HasValue)
            existing.EngineSafetyDriveMins = input.EngineSafetyDriveMins.Value;
        if (input.EngineSafetyDistKm.HasValue)
            existing.EngineSafetyDistKm = input.EngineSafetyDistKm.Value;
        if (input.IotSyncIntervalMs.HasValue)
            existing.IotSyncIntervalMs = input.IotSyncIntervalMs.Value;
        if (input.UrgentPainThreshold.HasValue)
            existing.UrgentPainThreshold = input.UrgentPainThreshold.Value;
        if (input.UrgentWellbeingThreshold.HasValue)
            existing.UrgentWellbeingThreshold = input.UrgentWellbeingThreshold.Value;

        await context.SaveChangesAsync(default);
        return true;
    }

    public async Task<bool> SyncAllToElasticsearch(
        [Service] IApplicationDbContext context,
        [Service] ISearchService searchService,
        CancellationToken cancellationToken
    )
    {
        // HARD RESET: Wipe and recreate indices to ensure fresh mappings
        await searchService.RecreateIndicesAsync(cancellationToken);

        var patients = await context.Patients.IgnoreQueryFilters().ToListAsync(cancellationToken);
        foreach (var p in patients)
            await searchService.IndexPatientAsync(p, cancellationToken);

        var outreach = await context
            .PatientOutreaches.IgnoreQueryFilters()
            .ToListAsync(cancellationToken);
        foreach (var o in outreach)
            await searchService.IndexOutreachAsync(o, cancellationToken);

        return true;
    }
}
