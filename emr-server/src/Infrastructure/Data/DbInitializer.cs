using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // 1. Ensure Database is created and migrations are applied
        await context.Database.MigrateAsync();

        // 2. Seed Roles
        string[] roles = { "Admin", "Practitioner", "CareNavigator" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 3. Seed Default Admin User
        var adminEmail = "admin@palliative.emr";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "System",
                LastName = "Administrator",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(adminUser, "P@ssword123!");
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }

        // 4. Seed Sample Practitioner
        if (!await context.Practitioners.AnyAsync())
        {
            var drHouse = new Practitioner
            {
                PractitionerId = Guid.NewGuid(),
                FirstName = "Gregory",
                LastName = "House",
                PrcLicenseNumber = "PH-12345",
                NpiNumber = "1234567890",
                IsActive = true
            };
            context.Practitioners.Add(drHouse);
            
            // Link a user to this practitioner
            var drUser = new ApplicationUser
            {
                UserName = "dr.house@palliative.emr",
                Email = "dr.house@palliative.emr",
                FirstName = "Gregory",
                LastName = "House",
                PractitionerId = drHouse.PractitionerId
            };
            await userManager.CreateAsync(drUser, "House@123!");
            await userManager.AddToRoleAsync(drUser, "Practitioner");
        }

        // 5. Seed Health Plans
        var careSource = await context.HealthPlans.FirstOrDefaultAsync(x => x.Name == "CareSource");
        if (careSource == null)
        {
            careSource = new HealthPlan { Name = "CareSource", Code = "CS-2026", Description = "Primary Palliative Partner" };
            context.HealthPlans.Add(careSource);
        }

        var philHealth = await context.HealthPlans.FirstOrDefaultAsync(x => x.Name == "PhilHealth");
        if (philHealth == null)
        {
            philHealth = new HealthPlan { Name = "PhilHealth", Code = "PH-NAT", Description = "National Health Insurance" };
            context.HealthPlans.Add(philHealth);
        }

        // 6. Seed Facilities
        var manilaMed = await context.Facilities.FirstOrDefaultAsync(x => x.Name == "Manila Medical Center");
        if (manilaMed == null)
        {
            manilaMed = new Facility { Name = "Manila Medical Center", Type = FacilityType.Hospital, Address = "United Nations Ave, Manila" };
            context.Facilities.Add(manilaMed);
        }

        // 7. Seed Medication Catalog
        if (!await context.Medications.AnyAsync())
        {
            context.Medications.AddRange(
                new Medication { Name = "Morphine Sulfate",    Strength = "5mg/ml", DefaultRoute = MedicationRoute.Sublingual },
                new Medication { Name = "Lorazepam (Ativan)",  Strength = "1mg",    DefaultRoute = MedicationRoute.Oral },
                new Medication { Name = "Oxygen",              Strength = "2L/min", DefaultRoute = MedicationRoute.Transdermal }
            );
            // ✅ Flush medications FIRST so step 9 can query them by name
            await context.SaveChangesAsync();
        }

        // 8. Seed Sample Patients
        if (!await context.Patients.AnyAsync())
        {
            await context.SaveChangesAsync(); // Save to get IDs for Plans/Facilities

            context.Patients.AddRange(
                new Patient
                {
                    PatientId = Guid.NewGuid(),
                    Mrn = "MRN-001",
                    FirstName = "John",
                    LastName = "Doe",
                    Dob = new DateTime(1955, 5, 20, 0, 0, 0, DateTimeKind.Utc),
                    BiologicalSex = "Male",
                    Address = "123 Palliative St",
                    City = "Manila",
                    HealthPlanId = careSource.HealthPlanId,
                    FacilityId = manilaMed.FacilityId
                },
                new Patient
                {
                    PatientId = Guid.NewGuid(),
                    Mrn = "MRN-002",
                    FirstName = "Jane",
                    LastName = "Smith",
                    Dob = new DateTime(1960, 10, 12, 0, 0, 0, DateTimeKind.Utc),
                    BiologicalSex = "Female",
                    Address = "456 Hospice Ave",
                    City = "Quezon City",
                    HealthPlanId = philHealth.HealthPlanId
                }
            );
            await context.SaveChangesAsync();
        }

        // 9. Seed Sample Prescriptions for John Doe
        if (!await context.Prescriptions.AnyAsync())
        {
            var john     = await context.Patients.FirstOrDefaultAsync(x => x.Mrn == "MRN-001");
            var drHouse  = await context.Practitioners.FirstOrDefaultAsync(x => x.LastName == "House");
            var morphine = await context.Medications.FirstOrDefaultAsync(x => x.Name == "Morphine Sulfate");
            var ativan   = await context.Medications.FirstOrDefaultAsync(x => x.Name == "Lorazepam (Ativan)");

            // Only seed if all dependencies exist — avoids crash on partial seed runs
            if (john != null && drHouse != null && morphine != null && ativan != null)
            {
                context.Prescriptions.AddRange(
                    new Prescription
                    {
                        PatientId      = john.PatientId,
                        MedicationId   = morphine.MedicationId,
                        Dose           = "0.5ml",
                        Frequency      = "Q4H PRN",
                        Route          = MedicationRoute.Sublingual,
                        StartDate      = DateTimeOffset.UtcNow,
                        PrescribedById = drHouse.PractitionerId
                    },
                    new Prescription
                    {
                        PatientId      = john.PatientId,
                        MedicationId   = ativan.MedicationId,
                        Dose           = "1mg",
                        Frequency      = "Q6H PRN",
                        Route          = MedicationRoute.Oral,
                        StartDate      = DateTimeOffset.UtcNow,
                        PrescribedById = drHouse.PractitionerId
                    }
                );
            }
        }

        await context.SaveChangesAsync();
    }
}
