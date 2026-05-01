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
        try {
            await context.Database.MigrateAsync();
        } catch (Exception ex) {
            Console.WriteLine($"[Seeding Warning] Migration failed: {ex.Message}");
        }

        // 1b. TURBO-FORCE SCHEMA REPAIR (Addressing specific Postgres legacy mismatches)
        try {
            var repairSql = @"
                -- Repair Practitioners
                ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS is_care_navigator BOOLEAN DEFAULT FALSE;
                ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS is_supporting_clinician BOOLEAN DEFAULT FALSE;
                ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS base_latitude DOUBLE PRECISION;
                ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS base_longitude DOUBLE PRECISION;
                ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS position TEXT;
                
                -- Ensure roles are correct for House and Wilson
                UPDATE practitioners SET is_care_navigator = TRUE, position = 'CareNavigator' WHERE last_name = 'House';
                UPDATE practitioners SET is_supporting_clinician = TRUE, position = 'Physician' WHERE last_name = 'Wilson';

                -- Repair Appointments (Foreign Key Casing and Logistics)
                ALTER TABLE appointments ADD COLUMN IF NOT EXISTS travel_time_minutes DOUBLE PRECISION;
                ALTER TABLE appointments ADD COLUMN IF NOT EXISTS distance_in_miles DOUBLE PRECISION;
                
                -- Populate dummy travel data for existing appointments to satisfy UI requirements
                UPDATE appointments SET travel_time_minutes = 15, distance_in_miles = 4.2 WHERE travel_time_minutes IS NULL;

                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'PractitionerId') THEN
                        ALTER TABLE appointments RENAME COLUMN ""PractitionerId"" TO practitioner_id;
                    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'practitioner_id') THEN
                        ALTER TABLE appointments ADD COLUMN practitioner_id UUID;
                    END IF;
                END $$;

                -- FULL SHIFT RESET (Ensures fresh data for availability)
                CREATE TABLE IF NOT EXISTS provider_shifts (
                    provider_shift_id UUID PRIMARY KEY,
                    practitioner_id UUID NOT NULL,
                    day_of_week INTEGER NOT NULL,
                    start_time INTERVAL NOT NULL,
                    end_time INTERVAL NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE
                );
                TRUNCATE TABLE provider_shifts;
            ";
            await context.Database.ExecuteSqlRawAsync(repairSql);
            Console.WriteLine("[Seeding] Schema repair and Shift Reset completed successfully.");
        } catch (Exception ex) {
            Console.WriteLine($"[Seeding Warning] Schema repair failed: {ex.Message}");
        }

        // 2. Seed Roles
        string[] roles = { "Admin", "Practitioner", "CareNavigator" };
        foreach (var role in roles)
        {
            try {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            } catch (Exception ex) {
                Console.WriteLine($"[Seeding Warning] Could not seed role {role}: {ex.Message}");
            }
        }

        // 3. Seed Default Admin User
        try {
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
        } catch (Exception ex) {
            Console.WriteLine($"[Seeding Warning] Could not seed admin user: {ex.Message}");
        }

        // 4. Unified Clinical Sync (Practitioners, Users, and Shifts)
        var clinicalStaff = new[] {
            new { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Email = "dr.house@palliative.emr", First = "Gregory", Last = "House", Role = "CareNavigator", Lat = 14.5995, Lon = 120.9842, Npi = "1234567890", License = "PH-12345" },
            new { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Email = "dr.wilson@palliative.emr", First = "James", Last = "Wilson", Role = "Practitioner", Lat = 14.6091, Lon = 121.0223, Npi = "0987654321", License = "PH-67890" }
        };

        foreach (var staff in clinicalStaff)
        {
            try {
                // A. Sync User
                var user = await userManager.FindByEmailAsync(staff.Email);
                if (user == null)
                {
                    user = new ApplicationUser { UserName = staff.Email, Email = staff.Email, FirstName = staff.First, LastName = staff.Last, EmailConfirmed = true };
                    await userManager.CreateAsync(user, "Practitioner@123!");
                    await userManager.AddToRoleAsync(user, staff.Role);
                }

                // B. Sync Practitioner
                var practitioner = await context.Practitioners.FirstOrDefaultAsync(p => p.UserId == Guid.Parse(user.Id))
                                   ?? await context.Practitioners.FirstOrDefaultAsync(p => p.LastName == staff.Last);

                if (practitioner == null)
                {
                    practitioner = new Practitioner { PractitionerId = staff.Id, UserId = Guid.Parse(user.Id) };
                    context.Practitioners.Add(practitioner);
                }

                practitioner.FirstName = staff.First;
                practitioner.LastName = staff.Last;
                practitioner.NpiNumber = staff.Npi;
                practitioner.PrcLicenseNumber = staff.License;
                practitioner.IsActive = true;
                practitioner.IsCareNavigator = staff.Role == "CareNavigator";
                practitioner.IsSupportingClinician = staff.Role == "Practitioner";
                practitioner.BaseLatitude = staff.Lat;
                practitioner.BaseLongitude = staff.Lon;
                practitioner.Position = staff.Role == "CareNavigator" ? PractitionerPosition.CareNavigator : PractitionerPosition.Physician;
                practitioner.UserId = Guid.Parse(user.Id); // Force link

                await context.SaveChangesAsync();

                // C. Sync Shifts
                int shiftCount = 0;
                foreach (DayOfWeek day in Enum.GetValues(typeof(DayOfWeek)))
                {
                    context.ProviderShifts.Add(new ProviderShift { 
                        ProviderShiftId = Guid.NewGuid(),
                        PractitionerId = practitioner.PractitionerId, 
                        DayOfWeek = day, 
                        StartTime = new TimeSpan(8, 0, 0), 
                        EndTime = new TimeSpan(17, 0, 0) 
                    });
                    shiftCount++;
                }
                await context.SaveChangesAsync();
                Console.WriteLine($"[Seeding] Synced {staff.Email} with {shiftCount} shifts.");

            } catch (Exception ex) {
                Console.WriteLine($"[Seeding Warning] Failed to sync staff {staff.Email}: {ex.Message}");
            }
        }

        // 5. Seed Gold-Standard Test Patient (Jane Smith)
        try {
            var jane = await context.Patients.FirstOrDefaultAsync(p => p.FirstName == "Jane" && p.LastName == "Smith");
            if (jane == null)
            {
                jane = new Patient { 
                    PatientId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                    FirstName = "Jane", 
                    LastName = "Smith", 
                    Mrn = "MRN-2026-0001", 
                    Dob = new DateTime(1985, 5, 20), 
                    BiologicalSex = "Female", 
                    Address = "456 Hospice Ave, Manila", 
                    City = "Manila", 
                    PostalCode = "1000", 
                    CreatedAt = DateTime.UtcNow 
                };
                context.Patients.Add(jane);
            }
            jane.Latitude = 14.5995;
            jane.Longitude = 120.9842;
            await context.SaveChangesAsync();
            Console.WriteLine($"[Seeding] Synced Gold-Standard Patient: {jane.FirstName} {jane.LastName}");
        } catch (Exception ex) {
            Console.WriteLine($"[Seeding Warning] Could not sync test patient: {ex.Message}");
        }

        Console.WriteLine(">>> SEEDING COMPLETE: Clinical Environment is ready.");

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

        // Ensure role flags are set for existing practitioners
    }
}
