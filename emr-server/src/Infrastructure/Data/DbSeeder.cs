using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IApplicationDbContext context)
    {
        // 1. Seed Health Plans
        if (!await context.HealthPlans.AnyAsync())
        {
            var plans = new List<HealthPlan>
            {
                new HealthPlan { Name = "CareSource", Code = "CS-2026", Description = "Primary Palliative Partner" },
                new HealthPlan { Name = "PhilHealth", Code = "PH-NAT", Description = "National Health Insurance" },
                new HealthPlan { Name = "Maxicare", Code = "MAXI-CORP", Description = "Private Corporate" }
            };
            context.HealthPlans.AddRange(plans);
        }

        // 2. Seed Medication Catalog
        if (!await context.Medications.AnyAsync())
        {
            var meds = new List<Medication>
            {
                new Medication { Name = "Morphine Sulfate", Strength = "5mg/ml", DefaultRoute = MedicationRoute.Sublingual },
                new Medication { Name = "Lorazepam (Ativan)", Strength = "1mg", DefaultRoute = MedicationRoute.Oral },
                new Medication { Name = "Haloperidol", Strength = "2mg/ml", DefaultRoute = MedicationRoute.Subcutaneous },
                new Medication { Name = "Oxygen", Strength = "2L/min", DefaultRoute = MedicationRoute.Transdermal } // Route as Nasal Cannula proxy
            };
            context.Medications.AddRange(meds);
        }

        // 3. Seed Facilities
        if (!await context.Facilities.AnyAsync())
        {
            var facilities = new List<Facility>
            {
                new Facility { Name = "Manila Medical Center", Type = FacilityType.Hospital, Address = "United Nations Ave, Manila" },
                new Facility { Name = "QC Care Home", Type = FacilityType.NursingHome, Address = "Quezon City, Metro Manila" }
            };
            context.Facilities.AddRange(facilities);
        }

        // 4. Seed Outreach Scripts
        if (!await context.OutreachScripts.AnyAsync())
        {
            var scripts = new List<OutreachScript>
            {
                new OutreachScript { 
                    LocationName = "Manila", 
                    ScriptTitle = "Standard Enrollment", 
                    Content = "Hello, I am calling from the Palliative Team in Manila regarding your recent referral..." 
                }
            };
            context.OutreachScripts.AddRange(scripts);
        }

        await context.SaveChangesAsync(CancellationToken.None);
    }
}
