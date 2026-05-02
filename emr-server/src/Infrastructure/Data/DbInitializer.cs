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

        // 2. WIPE RECORDS (Except Identity)
        try {
            // Re-fetch context to ensure it has latest model if needed
            var wipeSql = @"
                TRUNCATE TABLE 
                    appointments, 
                    clinical_encounters,
                    prescriptions, 
                    patient_outreaches, 
                    patients, 
                    practitioners, 
                    provider_shifts, 
                    facilities, 
                    health_plans, 
                    medications,
                    clinical_notes,
                    allergies,
                    vital_signs,
                    sdoh_assessments,
                    navigation_tasks,
                    intervention_logs,
                    barrier_logs,
                    z_benefit_claims,
                    claim_status_logs,
                    billing_invoices,
                    durable_medical_equipment,
                    equipment_deliveries,
                    telemetry_logs,
                    practitioner_licensures,
                    practitioner_service_areas,
                    patient_contacts,
                    patient_phones,
                    patient_emails,
                    advance_directives
                CASCADE;
            ";
            await context.Database.ExecuteSqlRawAsync(wipeSql);
            Console.WriteLine("[Seeding] Database wiped (excluding Identity tables).");
        } catch (Exception ex) {
            Console.WriteLine($"[Seeding Warning] Wipe failed: {ex.Message}. This is expected if tables don't exist yet.");
        }

        // 4. Seed Roles
        string[] roles = { "Admin", "Practitioner", "CareNavigator" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // 5. Seed Staff & Practitioners (Re-linking to existing Users if they exist)
        var clinicalStaff = new[] {
            new { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Email = "dr.house@palliative.emr", First = "Gregory", Last = "House", Role = "CareNavigator", City = "Manila", Lat = 14.5995, Lon = 120.9842 },
            new { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Email = "dr.wilson@palliative.emr", First = "James", Last = "Wilson", Role = "Practitioner", City = "Quezon City", Lat = 14.6760, Lon = 121.0437 },
            new { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Email = "nurse.ratched@palliative.emr", First = "Mildred", Last = "Ratched", Role = "CareNavigator", City = "Pasig", Lat = 14.5733, Lon = 121.0567 },
            new { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Email = "dr.strange@palliative.emr", First = "Stephen", Last = "Strange", Role = "Practitioner", City = "Makati", Lat = 14.5547, Lon = 121.0244 },
            new { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Email = "dr.grey@palliative.emr", First = "Meredith", Last = "Grey", Role = "Practitioner", City = "Taguig", Lat = 14.5176, Lon = 121.0509 }
        };

        foreach (var staff in clinicalStaff)
        {
            var user = await userManager.FindByEmailAsync(staff.Email);
            if (user == null)
            {
                user = new ApplicationUser { UserName = staff.Email, Email = staff.Email, FirstName = staff.First, LastName = staff.Last, EmailConfirmed = true };
                await userManager.CreateAsync(user, "Practitioner@123!");
                await userManager.AddToRoleAsync(user, staff.Role);
            }

            var practitioner = new Practitioner 
            { 
                PractitionerId = staff.Id, 
                UserId = Guid.Parse(user.Id),
                FirstName = staff.First,
                LastName = staff.Last,
                IsActive = true,
                IsCareNavigator = staff.Role == "CareNavigator",
                IsSupportingClinician = staff.Role == "Practitioner",
                Position = staff.Role == "CareNavigator" ? PractitionerPosition.Nurse : PractitionerPosition.Physician,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        Address = new Address { Street = "Main Office Base", City = staff.City, Latitude = staff.Lat, Longitude = staff.Lon },
                        Type = AddressType.Work,
                        IsPrimary = true
                    }
                }
            };
            context.Practitioners.Add(practitioner);

            // Seed Shifts for all staff
            foreach (DayOfWeek day in Enum.GetValues(typeof(DayOfWeek)))
            {
                if (day == DayOfWeek.Saturday || day == DayOfWeek.Sunday) continue;
                context.ProviderShifts.Add(new ProviderShift { 
                    ProviderShiftId = Guid.NewGuid(),
                    PractitionerId = practitioner.PractitionerId, 
                    DayOfWeek = day, 
                    StartTime = new TimeSpan(8, 0, 0), 
                    EndTime = new TimeSpan(17, 0, 0) 
                });
            }
        }
        await context.SaveChangesAsync();

        // 6. Seed Health Plans (5 records)
        var plans = new List<HealthPlan> {
            new() { Name = "CareSource Gold", Code = "CS-G", Description = "Premium Palliative Coverage" },
            new() { Name = "PhilHealth National", Code = "PH-NAT", Description = "National Health Insurance" },
            new() { Name = "Maxicare Plus", Code = "MX-P", Description = "Private Health Partner" },
            new() { Name = "Intellicare Elite", Code = "IC-E", Description = "Corporate Managed Care" },
            new() { Name = "Medicard Direct", Code = "MC-D", Description = "Specialized Hospice Plan" }
        };
        context.HealthPlans.AddRange(plans);
        await context.SaveChangesAsync();

        // 7. Seed Facilities (5 records)
        var facilities = new List<Facility> {
            new() { Name = "Manila Medical Center", Type = FacilityType.Hospital, FacilityAddress = new Address { Street = "UN Ave", City = "Manila", Latitude = 14.5800, Longitude = 120.9800 } },
            new() { Name = "St. Lukes BGC", Type = FacilityType.Hospital, FacilityAddress = new Address { Street = "32nd St", City = "Taguig", Latitude = 14.5500, Longitude = 121.0500 } },
            new() { Name = "Makati Med", Type = FacilityType.Hospital, FacilityAddress = new Address { Street = "Amorsolo St", City = "Makati", Latitude = 14.5600, Longitude = 121.0100 } },
            new() { Name = "Cebu Doctors Hospital", Type = FacilityType.Hospital, FacilityAddress = new Address { Street = "Osmena Blvd", City = "Cebu", Latitude = 10.3100, Longitude = 123.8900 } },
            new() { Name = "Davao Medical School", Type = FacilityType.Hospital, FacilityAddress = new Address { Street = "Bajada", City = "Davao", Latitude = 7.0700, Longitude = 125.6100 } }
        };
        context.Facilities.AddRange(facilities);
        await context.SaveChangesAsync();

        // 8. Seed Medications (8 records)
        var medications = new List<Medication> {
            new() { Name = "Morphine Sulfate", Strength = "5mg/ml", DefaultRoute = MedicationRoute.Sublingual },
            new() { Name = "Lorazepam (Ativan)", Strength = "1mg", DefaultRoute = MedicationRoute.Oral },
            new() { Name = "Oxygen", Strength = "2L/min", DefaultRoute = MedicationRoute.Inhalation },
            new() { Name = "Haloperidol", Strength = "2mg/ml", DefaultRoute = MedicationRoute.Oral },
            new() { Name = "Fentanyl Patch", Strength = "25mcg/hr", DefaultRoute = MedicationRoute.Transdermal },
            new() { Name = "Hyoscine", Strength = "20mg", DefaultRoute = MedicationRoute.Subcutaneous },
            new() { Name = "Metoclopramide", Strength = "10mg", DefaultRoute = MedicationRoute.Oral },
            new() { Name = "Dexamethasone", Strength = "4mg", DefaultRoute = MedicationRoute.Oral }
        };
        context.Medications.AddRange(medications);
        await context.SaveChangesAsync();

        // 9. Seed Patients (10 records)
        var random = new Random();
        var patientNames = new[] { 
            ("Jane", "Smith"), ("John", "Doe"), ("Maria", "Santos"), ("Juan", "Rizal"), 
            ("Antonio", "Luna"), ("Teresa", "Magbanua"), ("Melchora", "Aquino"), 
            ("Andres", "Bonifacio"), ("Jose", "Pilar"), ("Gabriela", "Silang") 
        };

        var practitioners = await context.Practitioners.ToListAsync();
        var seededPatients = new List<Patient>();

        foreach (var (first, last) in patientNames)
        {
            var p = new Patient
            {
                PatientId = Guid.NewGuid(),
                Mrn = $"MRN-{random.Next(10000, 99999)}",
                FirstName = first,
                LastName = last,
                Dob = new DateTime(random.Next(1940, 1970), random.Next(1, 13), random.Next(1, 28), 0, 0, 0, DateTimeKind.Utc),
                BiologicalSex = random.Next(2) == 0 ? "Female" : "Male",
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        Address = new Address {
                            Street = $"{random.Next(1, 999)} Residential St",
                            City = facilities[random.Next(facilities.Count)].FacilityAddress.City,
                            State = "NCR",
                            PostalCode = $"{random.Next(1000, 9999)}",
                            Latitude = facilities[0].FacilityAddress.Latitude + (random.NextDouble() - 0.5) * 0.1,
                            Longitude = facilities[0].FacilityAddress.Longitude + (random.NextDouble() - 0.5) * 0.1
                        },
                        Type = AddressType.Home,
                        IsPrimary = true
                    }
                },
                HealthPlanId = plans[random.Next(plans.Count)].HealthPlanId,
                FacilityId = facilities[random.Next(facilities.Count)].FacilityId,
            };
            context.Patients.Add(p);
            seededPatients.Add(p);
        }
        await context.SaveChangesAsync();

        // 10. Seed Clinical Data for first 5 patients
        for (int i = 0; i < 5; i++)
        {
            var patient = seededPatients[i];
            var practitioner = practitioners[random.Next(practitioners.Count)];

            // Seed Appointment
            var appointment = new Appointment
            {
                PatientId = patient.PatientId,
                PractitionerId = practitioner.PractitionerId,
                ScheduledStart = DateTimeOffset.UtcNow.AddDays(random.Next(-5, 5)).AddHours(random.Next(8, 16)),
                ScheduledEnd = DateTimeOffset.UtcNow.AddDays(random.Next(-5, 5)).AddHours(17),
                Status = AppointmentStatus.Scheduled,
                Modality = AppointmentModality.InPersonHomeVisit,
                VisitType = VisitType.RoutineSymptomManagement
            };
            context.Appointments.Add(appointment);

            // Seed Clinical Encounter
            var encounter = new ClinicalEncounter
            {
                PatientId = patient.PatientId,
                PractitionerId = practitioner.PractitionerId,
                EncounterDate = appointment.ScheduledStart,
                Type = EncounterType.RoutineFollowUp,
                Status = EncounterStatus.Completed,
                ChiefComplaint = "Follow up on palliative care plan."
            };
            context.ClinicalEncounters.Add(encounter);

            // Seed Prescription
            var med = medications[random.Next(medications.Count)];
            context.Prescriptions.Add(new Prescription
            {
                PatientId = patient.PatientId,
                MedicationId = med.MedicationId,
                PrescribedById = practitioner.PractitionerId,
                Dose = "As needed",
                Frequency = "Q4H",
                Route = med.DefaultRoute,
                StartDate = DateTimeOffset.UtcNow,
                IsActive = true
            });

            // Seed Allergy
            context.Allergies.Add(new Allergy
            {
                PatientId = patient.PatientId,
                Allergen = "Peanuts",
                Severity = SeverityLevel.Severe,
                Reaction = "Anaphylaxis",
                IdentifiedAt = DateTimeOffset.UtcNow.AddYears(-1)
            });
        }
        await context.SaveChangesAsync();

        // 11. Seed Outreach Leads (15 records)
        var outreachNames = new[] {
            ("Michael", "Abad"), ("Sarah", "Belmonte"), ("Robert", "Castillo"), ("Elena", "Dizon"),
            ("David", "Esguerra"), ("Maria", "Ferrer"), ("Juan", "Guevarra"), ("Grace", "Hernandez"),
            ("Antonio", "Ilagan"), ("Corazon", "Jimenez"), ("Benigno", "Katigbak"), ("Imelda", "Ledesma"),
            ("Ferdinand", "Mendoza"), ("Cory", "Navarro"), ("Ramon", "Ortega")
        };

        foreach (var (first, last) in outreachNames)
        {
            context.PatientOutreaches.Add(new PatientOutreach { 
                FirstName = first, 
                LastName = last, 
                MailingAddress = new Address { 
                    Street = $"{random.Next(1, 999)} Prospect Way", 
                    City = "Manila", 
                    State = "NCR",
                    PostalCode = "1000"
                }, 
                PrimaryPhone = $"+63 9{random.Next(100, 999)} {random.Next(100, 999)} {random.Next(1000, 9999)}",
                PrimaryEmail = $"{first.ToLower()}.{last.ToLower()}@example.com",
                ReferralSource = "Community Agency", 
                Status = OutreachStatus.Lead,
                OtherContacts = new List<OutreachContact>
                {
                    new OutreachContact
                    {
                        FirstName = "Maria",
                        LastName = last,
                        Relationship = RelationshipType.Spouse,
                        PhoneNumber = $"+63 9{random.Next(100, 999)} {random.Next(100, 999)} {random.Next(1000, 9999)}",
                        Email = $"maria.{last.ToLower()}@example.com",
                        IsPrimaryContact = false
                    },
                    new OutreachContact
                    {
                        FirstName = "Junior",
                        LastName = last,
                        Relationship = RelationshipType.Child,
                        PhoneNumber = $"+63 9{random.Next(100, 999)} {random.Next(100, 999)} {random.Next(1000, 9999)}",
                        IsPrimaryContact = false
                    }
                }
            });
        }

        await context.SaveChangesAsync();

        Console.WriteLine("[Seeding Overhaul Complete] 5 Practitioners, 5 Plans, 5 Facilities, 8 Medications, 10 Patients, 5 Appointments/Encounters, 15 Outreach Leads.");
    }
}
