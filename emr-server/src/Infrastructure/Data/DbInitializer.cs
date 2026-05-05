using Application.Common.Utils;
using Bogus;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data
{
    public static class DbInitializer
    {
        private static readonly Guid adminPractitionerId = Guid.NewGuid();

        public static async Task InitializeAsync(
            IServiceProvider serviceProvider,
            bool wipeDb = true,
            bool seedDb = true
        )
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<
                UserManager<ApplicationUser>
            >();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Ensure the database is up to date with all migrations before wiping or seeding
            await context.Database.MigrateAsync();

            if (wipeDb)
            {
                await WipeDatabaseAsync(context);
            }

            // Seed Roles, Users, and Practitioners
            await SeedIdentityAsync(context, userManager, roleManager);

            if (seedDb)
            {
                await SeedDatabaseAsync(context);
            }
        }

        private static async Task SeedIdentityAsync(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager
        )
        {
            // Seed Roles
            var roles = new[] { "Admin", "CareNavigator", "Practitioner" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // Seed Admin User & Practitioner
            var adminEmail = "admin@palliative.emr";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString(),
                    UserName = adminEmail,
                    Email = adminEmail,
                    FirstName = "System",
                    LastName = "Admin",
                    EmailConfirmed = true,
                    PractitionerId = adminPractitionerId,
                };

                var result = await userManager.CreateAsync(adminUser, "P@ssword123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
            else
            {
                // FIX: Ensure existing admin user has a valid PractitionerId
                if (!adminUser.PractitionerId.HasValue || adminUser.PractitionerId == Guid.Empty)
                {
                    adminUser.PractitionerId = adminPractitionerId;
                    await userManager.UpdateAsync(adminUser);
                }
            }

            var existingAdminPractitioner = await context.Practitioners.FirstOrDefaultAsync(p =>
                p.UserId == Guid.Parse(adminUser.Id)
            );

            if (
                existingAdminPractitioner != null
                && existingAdminPractitioner.PractitionerId == Guid.Empty
            )
            {
                // PK Mutation is dangerous in EF. Delete and re-create instead.
                context.Practitioners.Remove(existingAdminPractitioner);
                await context.SaveChangesAsync(default);
                existingAdminPractitioner = null;
            }

            if (existingAdminPractitioner == null)
            {
                var adminPractitioner = new Practitioner
                {
                    PractitionerId = adminUser.PractitionerId ?? adminPractitionerId,
                    UserId = Guid.Parse(adminUser.Id),
                    FirstName = "System",
                    LastName = "Admin",
                    IsActive = true,
                    IsCareNavigator = true,
                    Position = PractitionerPosition.Admin,
                };
                context.Practitioners.Add(adminPractitioner);
            }

            // Seed Other Practitioners from CREDENTIALS.md
            var practitionerAccounts = new[]
            {
                new
                {
                    Email = "dr.house@palliative.emr",
                    First = "Gregory",
                    Last = "House",
                    Role = "CareNavigator",
                    Position = PractitionerPosition.Physician,
                },
                new
                {
                    Email = "dr.wilson@palliative.emr",
                    First = "James",
                    Last = "Wilson",
                    Role = "Practitioner",
                    Position = PractitionerPosition.Physician,
                },
                new
                {
                    Email = "dr.grey@palliative.emr",
                    First = "Meredith",
                    Last = "Grey",
                    Role = "Practitioner",
                    Position = PractitionerPosition.Physician,
                },
                new
                {
                    Email = "dr.murphy@palliative.emr",
                    First = "Shaun",
                    Last = "Murphy",
                    Role = "Practitioner",
                    Position = PractitionerPosition.Physician,
                },
                new
                {
                    Email = "dr.dorian@palliative.emr",
                    First = "John",
                    Last = "Dorian",
                    Role = "Practitioner",
                    Position = PractitionerPosition.Physician,
                },
                new
                {
                    Email = "dr.yang@palliative.emr",
                    First = "Cristina",
                    Last = "Yang",
                    Role = "Practitioner",
                    Position = PractitionerPosition.Physician,
                },
                new
                {
                    Email = "dr.mccoy@palliative.emr",
                    First = "Leonard",
                    Last = "McCoy",
                    Role = "Practitioner",
                    Position = PractitionerPosition.Physician,
                },
            };

            foreach (var acc in practitionerAccounts)
            {
                var user = await userManager.FindByEmailAsync(acc.Email);
                var pId = Guid.NewGuid();

                if (user == null)
                {
                    user = new ApplicationUser
                    {
                        Id = Guid.NewGuid().ToString(),
                        UserName = acc.Email,
                        Email = acc.Email,
                        FirstName = acc.First,
                        LastName = acc.Last,
                        EmailConfirmed = true,
                        PractitionerId = pId,
                    };

                    var result = await userManager.CreateAsync(user, "Practitioner@123!");
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, acc.Role);
                    }
                }
                else
                {
                    // FIX: Handle cases where the user exists but has an empty or null PractitionerId
                    if (!user.PractitionerId.HasValue || user.PractitionerId == Guid.Empty)
                    {
                        user.PractitionerId = pId;
                        await userManager.UpdateAsync(user);
                    }
                    else
                    {
                        pId = user.PractitionerId.Value;
                    }
                }

                var existingPractitioner = await context.Practitioners.FirstOrDefaultAsync(p =>
                    p.UserId == Guid.Parse(user.Id)
                );

                if (
                    existingPractitioner != null
                    && existingPractitioner.PractitionerId == Guid.Empty
                )
                {
                    context.Practitioners.Remove(existingPractitioner);
                    await context.SaveChangesAsync(default);
                    existingPractitioner = null;
                }

                if (existingPractitioner == null)
                {
                    var practitioner = new Practitioner
                    {
                        PractitionerId = pId,
                        UserId = Guid.Parse(user.Id),
                        FirstName = acc.First,
                        LastName = acc.Last,
                        IsActive = true,
                        IsCareNavigator = acc.Role == "CareNavigator",
                        IsSupportingClinician = acc.Role == "Practitioner",
                        Position = acc.Position,
                    };
                    context.Practitioners.Add(practitioner);
                }
            }

            await context.SaveChangesAsync(default);
        }

        public static async Task WipeDatabaseAsync(ApplicationDbContext context)
        {
            var tableNames = context
                .Model.GetEntityTypes()
                .Select(t => t.GetTableName())
                .Distinct()
                .Where(t =>
                    !string.IsNullOrEmpty(t)
                // We now allow wiping AspNet tables if a full wipe is requested
                // to ensure no "dirty" identity data persists across resets
                )
                .ToList();

            if (tableNames.Any())
            {
                var tablesToTruncate = string.Join(", ", tableNames.Select(t => $"\"{t}\""));
                var sql = $"TRUNCATE TABLE {tablesToTruncate} CASCADE;";
                await context.Database.ExecuteSqlRawAsync(sql);
            }
        }

        public static async Task SeedDatabaseAsync(ApplicationDbContext context)
        {
            // Only seed if the database is empty of patients to prevent unique constraint violations
            // (Practitioners are now seeded in SeedIdentityAsync)
            if (await context.Patients.AnyAsync())
                return;

            Randomizer.Seed = new Random(8675309); // Deterministic test data

            // Fetch practitioners seeded in Identity phase
            // FINAL GUARD: Ensure we ONLY pick practitioners with valid, non-zero IDs
            var allPractitioners = await context.Practitioners.ToListAsync();
            var practitioners = allPractitioners
                .Where(p => p.PractitionerId != Guid.Empty)
                .ToList();

            if (!practitioners.Any())
            {
                var debugInfo = string.Join(
                    ", ",
                    allPractitioners.Select(p => $"{p.LastName}:{p.PractitionerId}")
                );
                throw new Exception(
                    $"Seeding failed: No valid practitioners found. DB contained: {debugInfo}"
                );
            }

            var practitionerIds = practitioners.Select(p => p.PractitionerId).ToList();

            // ==========================================
            // SETUP TABLES (5 Records Each)
            // ==========================================

            var healthPlans = new Faker<HealthPlan>()
                .RuleFor(x => x.HealthPlanId, Guid.NewGuid)
                .RuleFor(x => x.Name, f => f.Company.CompanyName() + " Health")
                .RuleFor(x => x.Code, f => f.Random.String2(5))
                .Generate(5);
            context.Set<HealthPlan>().AddRange(healthPlans);

            var facilities = new Faker<Facility>()
                .RuleFor(x => x.FacilityId, Guid.NewGuid)
                .RuleFor(x => x.Name, f => f.Company.CompanyName() + " Medical Center")
                .RuleFor(x => x.Type, f => f.PickRandom<FacilityType>())
                .Generate(5);
            context.Set<Facility>().AddRange(facilities);

            var dme = new Faker<DurableMedicalEquipment>()
                .RuleFor(x => x.EquipmentId, Guid.NewGuid)
                .RuleFor(x => x.SerialNumber, f => $"SN-{f.IndexGlobal}-{f.Random.AlphaNumeric(5)}")
                .RuleFor(x => x.ModelName, f => f.Commerce.ProductName())
                .RuleFor(x => x.Type, f => f.PickRandom<EquipmentType>())
                .RuleFor(x => x.Status, f => f.PickRandom<EquipmentStatus>())
                .Generate(5);
            context.Set<DurableMedicalEquipment>().AddRange(dme);

            var medications = new List<Medication>
            {
                new Medication
                {
                    Name = "Morphine Sulfate (Roxanol)",
                    Strength = "20mg/mL",
                    DefaultRoute = MedicationRoute.Oral,
                },
                new Medication
                {
                    Name = "Lorazepam (Ativan)",
                    Strength = "0.5mg",
                    DefaultRoute = MedicationRoute.Sublingual,
                },
                new Medication
                {
                    Name = "Haloperidol (Haldol)",
                    Strength = "2mg/mL",
                    DefaultRoute = MedicationRoute.Oral,
                },
                new Medication
                {
                    Name = "Gabapentin (Neurontin)",
                    Strength = "300mg",
                    DefaultRoute = MedicationRoute.Oral,
                },
                new Medication
                {
                    Name = "Fentanyl Patch (Duragesic)",
                    Strength = "25mcg/hr",
                    DefaultRoute = MedicationRoute.Transdermal,
                },
                new Medication
                {
                    Name = "Midazolam (Versed)",
                    Strength = "5mg/mL",
                    DefaultRoute = MedicationRoute.Subcutaneous,
                },
                new Medication
                {
                    Name = "Scopolamine Patch (Transderm Scop)",
                    Strength = "1.5mg",
                    DefaultRoute = MedicationRoute.Transdermal,
                },
                new Medication
                {
                    Name = "Prednisone",
                    Strength = "5mg",
                    DefaultRoute = MedicationRoute.Oral,
                },
                new Medication
                {
                    Name = "Ondansetron (Zofran)",
                    Strength = "4mg",
                    DefaultRoute = MedicationRoute.Oral,
                },
                new Medication
                {
                    Name = "Dexamethasone (Decadron)",
                    Strength = "4mg",
                    DefaultRoute = MedicationRoute.Oral,
                },
            };
            context.Set<Medication>().AddRange(medications);

            var faker = new Faker();
            // Seed coordinates for practitioners around a tight SLC cluster (approx 10-15 mile radius)
            foreach (var p in practitioners)
            {
                var entityAddr = new EntityAddress
                {
                    EntityAddressId = Guid.NewGuid(),
                    PractitionerId = p.PractitionerId,
                    IsPrimary = true,
                    Type = AddressType.Home,
                    Address = new Address
                    {
                        Street = faker.Address.StreetAddress(),
                        City = "Salt Lake City",
                        State = "Utah",
                        PostalCode = faker.Address.ZipCode(),
                        Latitude = faker.Address.Latitude(40.70, 40.80),
                        Longitude = faker.Address.Longitude(-111.95, -111.85),
                    },
                };
                context.EntityAddresses.Add(entityAddr);
            }

            await context.SaveChangesAsync(default);

            // ==========================================
            // TRANSACTIONAL TABLES (10 Records Each)
            // ==========================================
            var patients = new Faker<Patient>()
                .RuleFor(p => p.PatientId, Guid.NewGuid)
                .RuleFor(p => p.FirstName, f => f.Name.FirstName())
                .RuleFor(p => p.LastName, f => f.Name.LastName())
                .RuleFor(p => p.Mrn, f => $"MRN-{f.IndexGlobal + 50000}")
                .RuleFor(
                    p => p.Dob,
                    f => f.Date.Past(80, DateTime.UtcNow.AddYears(-20)).ToUniversalTime()
                )
                .RuleFor(p => p.BiologicalSex, f => f.PickRandom("Male", "Female"))
                .RuleFor(
                    p => p.CivilStatus,
                    f => f.PickRandom("Single", "Married", "Widowed", "Divorced")
                )
                .RuleFor(
                    p => p.Religion,
                    f => f.PickRandom("Catholic", "Christian", "Muslim", "Buddhism", "None")
                )
                .RuleFor(p => p.Occupation, f => f.Name.JobTitle())
                .RuleFor(p => p.Nationality, f => "Filipino")
                .RuleFor(p => p.Language, f => "English")
                .RuleFor(p => p.HealthPlanId, f => f.PickRandom(healthPlans).HealthPlanId)
                .RuleFor(p => p.FacilityId, f => f.PickRandom(facilities).FacilityId)
                .RuleFor(
                    p => p.PhilhealthNumber,
                    f => $"PH-{f.IndexGlobal}-{f.Random.Number(1000, 9999)}"
                )
                .Generate(10);
            context.Patients.AddRange(patients);
            await context.SaveChangesAsync(default);

            // Seed Patient Contacts with POA
            var patientContacts = new List<PatientContact>();
            foreach (var p in patients)
            {
                // Spouse (Primary & POA)
                patientContacts.Add(
                    new PatientContact
                    {
                        ContactId = Guid.NewGuid(),
                        PatientId = p.PatientId,
                        FirstName = faker.Name.FirstName(),
                        LastName = p.LastName,
                        Relationship = RelationshipType.Spouse,
                        PhoneNumber = faker.Phone.PhoneNumber("###-###-####"),
                        Email = faker.Internet.Email(),
                        IsPrimaryContact = true,
                        HasPowerOfAttorney = true,
                        IsLegalGuardian = false,
                        Notes = "Primary medical decision maker and spouse.",
                    }
                );

                // Sibling (Legal Guardian)
                patientContacts.Add(
                    new PatientContact
                    {
                        ContactId = Guid.NewGuid(),
                        PatientId = p.PatientId,
                        FirstName = faker.Name.FirstName(),
                        LastName = p.LastName,
                        Relationship = RelationshipType.Sibling,
                        PhoneNumber = faker.Phone.PhoneNumber("###-###-####"),
                        Email = faker.Internet.Email(),
                        IsPrimaryContact = false,
                        HasPowerOfAttorney = false,
                        IsLegalGuardian = true,
                        Notes = "Court-appointed legal guardian.",
                    }
                );

                // Lawyer
                patientContacts.Add(
                    new PatientContact
                    {
                        ContactId = Guid.NewGuid(),
                        PatientId = p.PatientId,
                        FirstName = faker.Name.FirstName(),
                        LastName = faker.Name.LastName(),
                        Relationship = RelationshipType.Lawyer,
                        PhoneNumber = faker.Phone.PhoneNumber("###-###-####"),
                        Email = faker.Internet.Email(),
                        IsPrimaryContact = false,
                        HasPowerOfAttorney = false,
                        IsLegalGuardian = false,
                        Notes = "Legal counsel for estate and directives.",
                    }
                );
            }
            context.PatientContacts.AddRange(patientContacts);

            // Seed POA Documents
            var poaDocuments = patientContacts
                .Where(c => c.HasPowerOfAttorney)
                .Select(c => new PatientDocument
                {
                    PatientDocumentId = Guid.NewGuid(),
                    PatientId = c.PatientId,
                    PatientContactId = c.ContactId,
                    Title = "Durable Power of Attorney - Legal.pdf",
                    DocumentType = "POA",
                    StorageUrl = "/documents/poa_sample.pdf",
                    ContentType = "application/pdf",
                    FileSize = 102456,
                    UploadedAt = DateTimeOffset.UtcNow.AddMonths(-1),
                })
                .ToList();
            context.PatientDocuments.AddRange(poaDocuments);

            var patientOutreaches = new Faker<PatientOutreach>()
                .RuleFor(x => x.PatientOutreachId, Guid.NewGuid)
                .RuleFor(x => x.FirstName, f => f.Name.FirstName())
                .RuleFor(x => x.LastName, f => f.Name.LastName())
                .RuleFor(x => x.Status, f => f.PickRandom<OutreachStatus>())
                .RuleFor(x => x.Disposition, f => f.PickRandom<EnrollmentDisposition>())
                .RuleFor(x => x.HealthPlanId, f => f.PickRandom(healthPlans).HealthPlanId)
                .RuleFor(x => x.PrimaryPhone, f => f.Phone.PhoneNumber("###-###-####"))
                .RuleFor(x => x.PrimaryEmail, f => f.Internet.Email())
                .RuleFor(
                    x => x.MailingAddress,
                    f => new Address
                    {
                        Street = f.Address.StreetAddress(),
                        City = "Salt Lake City",
                        State = "Utah",
                        PostalCode = f.Address.ZipCode(),
                        Latitude = f.Address.Latitude(40.70, 40.80),
                        Longitude = f.Address.Longitude(-111.95, -111.85),
                    }
                )
                .Generate(10);
            context.Set<PatientOutreach>().AddRange(patientOutreaches);
            await context.SaveChangesAsync(default);

            var outreachContacts = new Faker<OutreachContact>()
                .RuleFor(x => x.OutreachContactId, Guid.NewGuid)
                .RuleFor(
                    x => x.PatientOutreachId,
                    f => f.PickRandom(patientOutreaches).PatientOutreachId
                )
                .RuleFor(x => x.FirstName, f => f.Name.FirstName())
                .RuleFor(x => x.LastName, f => f.Name.LastName())
                .RuleFor(x => x.Relationship, f => f.PickRandom<RelationshipType>())
                .RuleFor(x => x.PhoneNumber, f => f.Phone.PhoneNumber("###-###-####"))
                .Generate(10);
            context.Set<OutreachContact>().AddRange(outreachContacts);

            var outreachActivities = new Faker<OutreachActivity>()
                .RuleFor(x => x.OutreachActivityId, Guid.NewGuid)
                .RuleFor(x => x.OutreachId, f => f.PickRandom(patientOutreaches).PatientOutreachId)
                .RuleFor(x => x.PractitionerId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(x => x.Method, f => f.PickRandom<OutreachMethod>())
                .RuleFor(
                    x => x.Outcome,
                    f => f.PickRandom("NO_ANSWER", "INTERESTED", "LEFT_VOICEMAIL", "WRONG_NUMBER")
                )
                .RuleFor(x => x.Notes, f => f.Lorem.Sentence())
                .RuleFor(x => x.ActivityDate, f => f.Date.RecentOffset(5).ToUniversalTime())
                .Generate(10);
            context.Set<OutreachActivity>().AddRange(outreachActivities);

            var patientPhones = new Faker<PatientPhone>()
                .RuleFor(x => x.PhoneId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.PhoneNumber, f => f.Phone.PhoneNumber())
                .Generate(10);
            context.Set<PatientPhone>().AddRange(patientPhones);

            var entityAddresses = new Faker<EntityAddress>()
                .RuleFor(x => x.EntityAddressId, Guid.NewGuid)
                .RuleFor(
                    x => x.PatientId,
                    (f, u) => patients[f.IndexFaker % patients.Count].PatientId
                )
                .RuleFor(x => x.IsPrimary, true)
                .RuleFor(
                    x => x.Address,
                    f => new Address
                    {
                        Street = f.Address.StreetAddress(),
                        City = f.Address.City(),
                        State = "Utah",
                        PostalCode = f.Address.ZipCode(),
                        Latitude = f.Address.Latitude(40.70, 40.80),
                        Longitude = f.Address.Longitude(-111.95, -111.85),
                    }
                )
                .Generate(10);
            context.Set<EntityAddress>().AddRange(entityAddresses);

            var patientEmails = new Faker<PatientEmail>()
                .RuleFor(x => x.EmailId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.EmailAddress, f => f.Internet.Email())
                .Generate(10);
            context.Set<PatientEmail>().AddRange(patientEmails);

            var advanceDirectives = new Faker<AdvanceDirective>()
                .RuleFor(x => x.AdvanceDirectiveId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.Type, f => f.PickRandom<DirectiveType>())
                .RuleFor(x => x.EffectiveDate, f => f.Date.PastOffset().ToUniversalTime())
                .Generate(10);
            context.Set<AdvanceDirective>().AddRange(advanceDirectives);

            var diagnosesList = new Faker<Diagnosis>()
                .RuleFor(x => x.DiagnosisId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.Icd10Code, f => f.Random.AlphaNumeric(5))
                .RuleFor(x => x.Description, f => f.Lorem.Sentence())
                .Generate(10);
            context.Set<Diagnosis>().AddRange(diagnosesList);

            var allergiesList = new Faker<Allergy>()
                .RuleFor(x => x.AllergyId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.Allergen, f => f.Lorem.Word())
                .RuleFor(x => x.Severity, f => f.PickRandom<SeverityLevel>())
                .RuleFor(x => x.Reaction, f => f.Lorem.Word())
                .Generate(10);
            context.Set<Allergy>().AddRange(allergiesList);
            // Anchor perfectly to the user's Local Time Zone to prevent UTC shifting past 6 PM
            var baseDate = new DateTime(2026, 5, 4, 8, 0, 0, DateTimeKind.Local).ToUniversalTime();
            var modalities = Enum.GetValues<AppointmentModality>();

            var appointments = new Faker<Appointment>()
                .RuleFor(a => a.AppointmentId, Guid.NewGuid)
                .RuleFor(a => a.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(a => a.PractitionerId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(a => a.VisitType, f => f.PickRandom<VisitType>())
                .RuleFor(a => a.Status, f => f.PickRandom<AppointmentStatus>())
                // Weighted variety: favor In-Person modalities (60% In-Person, 40% Remote)
                .RuleFor(
                    a => a.Modality,
                    f =>
                    {
                        var p = f.Random.Number(1, 100);
                        if (p <= 35)
                            return AppointmentModality.InPersonFacility;
                        if (p <= 65)
                            return AppointmentModality.InPersonHomeVisit;
                        if (p <= 80)
                            return AppointmentModality.TelehealthVideo;
                        if (p <= 90)
                            return AppointmentModality.TelehealthAudioOnly;
                        return AppointmentModality.Telephone;
                    }
                )
                // Sequential spacing: 4 appointments per day, exactly 2 hours apart (8AM, 10AM, 12PM, 2PM Local Time)
                .RuleFor(
                    a => a.ScheduledStart,
                    f => baseDate.AddDays(f.IndexFaker / 4).AddHours((f.IndexFaker % 4) * 2)
                )
                .RuleFor(
                    a => a.ScheduledEnd,
                    (f, a) => a.ScheduledStart.AddMinutes(f.PickRandom(15, 30, 45, 60))
                )
                // Seed secondary clinicians (Care Navigators) - Ensure 80% assignment rate for realistic data
                .RuleFor(
                    a => a.SupportingClinicians,
                    (f, a) =>
                    {
                        if (f.Random.Bool(0.2f))
                            return new List<Practitioner>();
                        var p = practitioners
                            .Where(pr => pr.PractitionerId != a.PractitionerId)
                            .OrderBy(x => Guid.NewGuid())
                            .Take(1)
                            .ToList();
                        return p;
                    }
                )
                // Hardened Geospatial Seeding: Travel time ONLY if CN is assigned, it's In-Person, AND patient has a verified address
                .RuleFor(
                    a => a.TravelTimeMinutes,
                    (f, a) =>
                    {
                        var isTele =
                            a.Modality == AppointmentModality.TelehealthVideo
                            || a.Modality == AppointmentModality.TelehealthAudioOnly
                            || a.Modality == AppointmentModality.Telephone;
                        if (isTele)
                            return 0;
                        if (a.SupportingClinicians == null || !a.SupportingClinicians.Any())
                            return 0;

                        var patientAddr = context.EntityAddresses.Local.FirstOrDefault(ea =>
                            ea.PatientId == a.PatientId
                        );

                        // Final Consistency Fix: Use the actual GeoUtils math in the seeder
                        var pAddress = context
                            .EntityAddresses.Local.FirstOrDefault(ea =>
                                ea.PractitionerId == a.PractitionerId
                            )
                            ?.Address;

                        if (
                            pAddress == null
                            || !pAddress.Latitude.HasValue
                            || patientAddr?.Address?.Latitude.HasValue != true
                        )
                            return f.Random.Number(15, 30); // Random fallback buffer

                        var dist = Application.Common.Utils.GeoUtils.CalculateDistance(
                            pAddress.Latitude.Value,
                            pAddress.Longitude.Value,
                            patientAddr.Address.Latitude.Value,
                            patientAddr.Address.Longitude.Value
                        );

                        var time = Application.Common.Utils.GeoUtils.EstimateTravelTimeMinutes(
                            dist
                        );

                        // Add variety up to 45 mins with traffic jitter
                        var trafficJitter = f.Random.Number(0, 20);
                        return (int)Math.Clamp(Math.Round(time, 0) + trafficJitter, 15, 45);
                    }
                )
                .Generate(12); // Generate 12 to perfectly fill 3 days (4 per day)
            context.Appointments.AddRange(appointments);
            await context.SaveChangesAsync(default);

            var meds = context.Set<Medication>().Local.ToList();

            // --- CLINICAL DATA HARDENING ---
            foreach (var p in patients)
            {
                // Allergies
                var pAllergies = new Faker<Allergy>()
                    .RuleFor(a => a.PatientId, p.PatientId)
                    .RuleFor(
                        a => a.Allergen,
                        f =>
                            f.PickRandom(
                                new[]
                                {
                                    "Penicillin",
                                    "Peanuts",
                                    "Latex",
                                    "Sulfa Drugs",
                                    "Aspirin",
                                    "Shellfish",
                                }
                            )
                    )
                    .RuleFor(a => a.Severity, f => f.PickRandom<SeverityLevel>())
                    .RuleFor(
                        a => a.Reaction,
                        f =>
                            f.PickRandom(
                                new[]
                                {
                                    "Anaphylaxis",
                                    "Rash",
                                    "Hives",
                                    "Shortness of breath",
                                    "Itching",
                                }
                            )
                    )
                    .Generate(new Random().Next(0, 3));
                context.Set<Allergy>().AddRange(pAllergies);

                // Diagnoses (Problem List)
                var pDiagnoses = new Faker<Diagnosis>()
                    .RuleFor(d => d.PatientId, p.PatientId)
                    .RuleFor(
                        d => d.Icd10Code,
                        f => f.PickRandom(new[] { "C34.90", "I50.9", "E11.9", "J44.9", "F32.9" })
                    )
                    .RuleFor(
                        d => d.Description,
                        (f, d) =>
                            d.Icd10Code switch
                            {
                                "C34.90" =>
                                    "Malignant neoplasm of unspecified part of unspecified bronchus or lung",
                                "I50.9" => "Heart failure, unspecified",
                                "E11.9" => "Type 2 diabetes mellitus without complications",
                                "J44.9" => "Chronic obstructive pulmonary disease, unspecified",
                                "F32.9" => "Major depressive disorder, single episode, unspecified",
                                _ => "General Diagnosis",
                            }
                    )
                    .RuleFor(d => d.IsPrimary, f => f.IndexFaker == 0)
                    .Generate(new Random().Next(1, 4));
                context.Set<Diagnosis>().AddRange(pDiagnoses);

                // Medications (Prescriptions)
                var pPrescriptions = new Faker<Prescription>()
                    .RuleFor(pr => pr.PatientId, p.PatientId)
                    .RuleFor(pr => pr.MedicationId, f => f.PickRandom(meds).MedicationId)
                    .RuleFor(pr => pr.PrescribedById, f => f.PickRandom(practitionerIds))
                    .RuleFor(
                        pr => pr.Dose,
                        f => f.PickRandom(new[] { "5mg", "10mg", "20mg", "1 tab" })
                    )
                    .RuleFor(
                        pr => pr.Frequency,
                        f => f.PickRandom(new[] { "QD", "BID", "TID", "Q4H PRN" })
                    )
                    .RuleFor(pr => pr.StartDate, f => f.Date.PastOffset(1).ToUniversalTime())
                    .RuleFor(pr => pr.IsActive, true)
                    .Generate(new Random().Next(2, 6));
                context.Set<Prescription>().AddRange(pPrescriptions);
            }
            await context.SaveChangesAsync(default);

            // --- CLINICAL HISTORY RECONCILIATION ---
            if (!await context.ClinicalEncounters.AnyAsync())
            {
                var allEncounters = new List<ClinicalEncounter>();
                foreach (var p in patients)
                {
                    var pEncounters = new Faker<ClinicalEncounter>()
                        .RuleFor(e => e.EncounterId, Guid.NewGuid)
                        .RuleFor(e => e.PatientId, p.PatientId)
                        .RuleFor(e => e.PractitionerId, f => f.PickRandom(practitionerIds))
                        .RuleFor(
                            e => e.AppointmentId,
                            f => f.PickRandom(appointments).AppointmentId
                        )
                        .RuleFor(e => e.Type, f => f.PickRandom<EncounterType>())
                        .RuleFor(e => e.Status, EncounterStatus.Completed)
                        .RuleFor(e => e.PpsScore, f => f.Random.Number(30, 90))
                        .RuleFor(e => e.EncounterDate, f => f.Date.PastOffset(1).ToUniversalTime())
                        .Generate(10); // Increased to 10 for better history
                    allEncounters.AddRange(pEncounters);
                }
                context.ClinicalEncounters.AddRange(allEncounters);
                await context.SaveChangesAsync(default);

                var vitals = new List<VitalSign>();
                foreach (var e in allEncounters)
                {
                    // Generate 1-2 vitals per encounter for high density history
                    var count = new Random().Next(1, 3);
                    for (int i = 0; i < count; i++)
                    {
                        var v = new VitalSign
                        {
                            VitalId = Guid.NewGuid(),
                            EncounterId = e.EncounterId,
                            HeartRate = new Random().Next(60, 110),
                            BloodPressureSystolic = new Random().Next(105, 150),
                            BloodPressureDiastolic = new Random().Next(65, 95),
                            RespiratoryRate = new Random().Next(12, 24),
                            OxygenSaturation = new Random().Next(92, 100),
                            Temperature = (decimal)(97.2 + new Random().NextDouble() * 2.8),
                            Weight = new Random().Next(45, 105),
                            RecordedAt = e.EncounterDate.AddMinutes(-new Random().Next(0, 60)),
                        };
                        vitals.Add(v);
                    }
                }
                context.VitalSigns.AddRange(vitals);
                await context.SaveChangesAsync(default);
            }

            var encountersList = await context.ClinicalEncounters.ToListAsync();

            var notes = new Faker<ClinicalNote>()
                .RuleFor(n => n.NoteId, Guid.NewGuid)
                .RuleFor(n => n.EncounterId, (f, u) => f.PickRandom(encountersList).EncounterId)
                .RuleFor(n => n.AuthorId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(n => n.Type, f => f.PickRandom<NoteType>())
                .RuleFor(n => n.Subjective, f => f.Lorem.Paragraph())
                .Generate(20);
            context.Set<ClinicalNote>().AddRange(notes);

            var esas = new Faker<EsasAssessment>()
                .RuleFor(x => x.AssessmentId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.EncounterId, (f, u) => f.PickRandom(encountersList).EncounterId)
                .RuleFor(x => x.Pain, f => f.Random.Number(0, 10))
                .RuleFor(x => x.Nausea, f => f.Random.Number(0, 10))
                .RuleFor(x => x.ShortnessOfBreath, f => f.Random.Number(0, 10))
                .RuleFor(x => x.Tiredness, f => f.Random.Number(0, 10))
                .RuleFor(x => x.Drowsiness, f => f.Random.Number(0, 10))
                .RuleFor(x => x.LackOfAppetite, f => f.Random.Number(0, 10))
                .RuleFor(x => x.Wellbeing, f => f.Random.Number(0, 10))
                .RuleFor(x => x.Anxiety, f => f.Random.Number(0, 10))
                .RuleFor(x => x.Depression, f => f.Random.Number(0, 10))
                .RuleFor(x => x.AssessedAt, f => f.Date.RecentOffset(30).ToUniversalTime())
                .Generate(100);
            context.Set<EsasAssessment>().AddRange(esas);

            var deliveries = new Faker<EquipmentDelivery>()
                .RuleFor(x => x.DeliveryId, Guid.NewGuid)
                .RuleFor(x => x.EquipmentId, f => f.PickRandom(dme).EquipmentId)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.Status, f => f.PickRandom<DeliveryStatus>())
                .Generate(10);
            context.Set<EquipmentDelivery>().AddRange(deliveries);

            var telemetry = new Faker<TelemetryLog>()
                .RuleFor(x => x.LogId, Guid.NewGuid)
                .RuleFor(x => x.EquipmentId, f => f.PickRandom(dme).EquipmentId)
                .RuleFor(x => x.Value, f => f.Random.Decimal(1, 100))
                .RuleFor(x => x.RecordedAt, f => f.Date.RecentOffset().ToUniversalTime())
                .Generate(10);
            context.Set<TelemetryLog>().AddRange(telemetry);

            var cases = new Faker<CareNavigationCase>()
                .RuleFor(x => x.CaseId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.NavigatorId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(x => x.Status, f => f.PickRandom<CaseStatus>())
                .RuleFor(x => x.AcuityLevel, f => f.PickRandom<AcuityLevel>())
                .Generate(10);
            context.Set<CareNavigationCase>().AddRange(cases);
            await context.SaveChangesAsync(default);

            var barriers = new Faker<BarrierLog>()
                .RuleFor(x => x.BarrierId, Guid.NewGuid)
                .RuleFor(x => x.CaseId, f => f.PickRandom(cases).CaseId)
                .RuleFor(x => x.BarrierCategory, f => f.Lorem.Word())
                .Generate(10);
            context.Set<BarrierLog>().AddRange(barriers);

            var navTasks = new Faker<NavigationTask>()
                .RuleFor(x => x.TaskId, Guid.NewGuid)
                .RuleFor(x => x.CaseId, f => f.PickRandom(cases).CaseId)
                .RuleFor(x => x.AssignedToId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(x => x.Status, f => f.PickRandom<NavigationTaskStatus>())
                .Generate(10);
            context.Set<NavigationTask>().AddRange(navTasks);

            var interventions = new Faker<InterventionLog>()
                .RuleFor(x => x.InterventionId, Guid.NewGuid)
                .RuleFor(x => x.CaseId, f => f.PickRandom(cases).CaseId)
                .RuleFor(x => x.ActionTaken, f => f.Lorem.Sentence())
                .Generate(10);
            context.Set<InterventionLog>().AddRange(interventions);

            var sdoh = new Faker<SdohAssessment>()
                .RuleFor(x => x.SdohId, Guid.NewGuid)
                .RuleFor(x => x.CaseId, f => f.PickRandom(cases).CaseId)
                .RuleFor(x => x.AssessorId, f => f.PickRandom(practitioners).PractitionerId)
                .Generate(10);
            context.Set<SdohAssessment>().AddRange(sdoh);

            var shifts = new List<ProviderShift>();
            foreach (var p in practitioners)
            {
                for (int day = 1; day <= 5; day++)
                {
                    shifts.Add(
                        new ProviderShift
                        {
                            ProviderShiftId = Guid.NewGuid(),
                            PractitionerId = p.PractitionerId,
                            DayOfWeek = (DayOfWeek)day,
                            StartTime = new TimeSpan(8, 0, 0),
                            EndTime = new TimeSpan(18, 0, 0),
                        }
                    );
                }
            }
            context.Set<ProviderShift>().AddRange(shifts);

            var licenses = new Faker<PractitionerLicensure>()
                .RuleFor(x => x.LicensureId, Guid.NewGuid)
                .RuleFor(x => x.PractitionerId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(x => x.LicenseNumber, f => f.Random.AlphaNumeric(8))
                .Generate(10);
            context.Set<PractitionerLicensure>().AddRange(licenses);

            var areas = new Faker<PractitionerServiceArea>()
                .RuleFor(x => x.ServiceAreaId, Guid.NewGuid)
                .RuleFor(x => x.PractitionerId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(x => x.ZipCode, f => f.Address.ZipCode())
                .Generate(10);
            context.Set<PractitionerServiceArea>().AddRange(areas);

            var claims = new Faker<ZBenefitClaim>()
                .RuleFor(x => x.ClaimId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.PhilhealthNumber, f => f.Random.AlphaNumeric(10))
                .RuleFor(x => x.Status, f => f.PickRandom<ClaimStatus>())
                .Generate(10);
            context.Set<ZBenefitClaim>().AddRange(claims);
            await context.SaveChangesAsync(default);

            var claimLogs = new Faker<ClaimStatusLog>()
                .RuleFor(x => x.LogId, Guid.NewGuid)
                .RuleFor(x => x.ClaimId, f => f.PickRandom(claims).ClaimId)
                .RuleFor(x => x.PreviousStatus, f => f.PickRandom<ClaimStatus>())
                .RuleFor(x => x.NewStatus, f => f.PickRandom<ClaimStatus>())
                .Generate(10);
            context.Set<ClaimStatusLog>().AddRange(claimLogs);

            var invoices = new Faker<BillingInvoice>()
                .RuleFor(x => x.InvoiceId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.ClaimId, f => f.PickRandom(claims).ClaimId)
                .RuleFor(
                    x => x.InvoiceNumber,
                    f => $"INV-{f.IndexGlobal}-{f.Random.AlphaNumeric(5)}"
                )
                .RuleFor(x => x.Status, f => f.PickRandom<InvoiceStatus>())
                .Generate(10);
            context.Set<BillingInvoice>().AddRange(invoices);

            var scripts = new List<OutreachScript>
            {
                new OutreachScript
                {
                    ScriptTitle = "Standard Orientation Script",
                    LocationName = "Salt Lake City",
                    PostalCode = "84101",
                    Content =
                        "Hello, I am calling from the Aura Clinical Logistics Team. We've identified you as a candidate for our specialized health support services in the Salt Lake region. Our goal is to verify your eligibility and schedule a diagnostic orientation at your convenience.",
                    IsDefault = true,
                },
                new OutreachScript
                {
                    ScriptTitle = "Urgent Follow-up Protocol",
                    LocationName = "Salt Lake City",
                    PostalCode = "84111",
                    Content =
                        "This is a priority follow-up regarding your recent health inquiry. We need to finalize your clinical orientation to ensure uninterrupted access to your care navigator and supporting clinical staff.",
                    IsDefault = false,
                },
            };
            context.Set<OutreachScript>().AddRange(scripts);
            await context.SaveChangesAsync(default);
        }
    }
}
