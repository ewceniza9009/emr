using Bogus;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(
            IServiceProvider serviceProvider,
            bool wipeDb = true,
            bool seedDb = true
        )
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            if (wipeDb)
            {
                await WipeDatabaseAsync(context);
            }

            if (seedDb)
            {
                await SeedDatabaseAsync(context);
            }
        }

        public static async Task WipeDatabaseAsync(ApplicationDbContext context)
        {
            var tableNames = context
                .Model.GetEntityTypes()
                .Select(t => t.GetTableName())
                .Distinct()
                .Where(t =>
                    !string.IsNullOrEmpty(t)
                    && !t.StartsWith("AspNet", StringComparison.OrdinalIgnoreCase)
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
            // Only seed if the database is empty to prevent unique constraint violations
            if (await context.Practitioners.AnyAsync())
                return;

            Randomizer.Seed = new Random(8675309); // Deterministic test data

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

            var outreachScripts = new Faker<OutreachScript>()
                .RuleFor(x => x.OutreachScriptId, Guid.NewGuid)
                .RuleFor(x => x.LocationName, f => f.Address.City())
                .RuleFor(x => x.ScriptTitle, f => f.Lorem.Word())
                .RuleFor(x => x.Content, f => f.Lorem.Paragraph())
                .Generate(5);
            context.Set<OutreachScript>().AddRange(outreachScripts);

            var dme = new Faker<DurableMedicalEquipment>()
                .RuleFor(x => x.EquipmentId, Guid.NewGuid)
                .RuleFor(x => x.SerialNumber, f => $"SN-{f.IndexGlobal}-{f.Random.AlphaNumeric(5)}")
                .RuleFor(x => x.ModelName, f => f.Commerce.ProductName())
                .RuleFor(x => x.Type, f => f.PickRandom<EquipmentType>())
                .RuleFor(x => x.Status, f => f.PickRandom<EquipmentStatus>())
                .Generate(5);
            context.Set<DurableMedicalEquipment>().AddRange(dme);

            var careNavigators = new Faker<Practitioner>()
                .RuleFor(p => p.PractitionerId, Guid.NewGuid)
                .RuleFor(p => p.UserId, Guid.NewGuid)
                .RuleFor(p => p.FirstName, f => f.Name.FirstName())
                .RuleFor(p => p.LastName, f => f.Name.LastName())
                .RuleFor(p => p.IsActive, true)
                .RuleFor(p => p.IsCareNavigator, true)
                .RuleFor(p => p.IsSupportingClinician, false)
                .RuleFor(p => p.Position, PractitionerPosition.Nurse)
                .Generate(5);

            var supportingClinicians = new Faker<Practitioner>()
                .RuleFor(p => p.PractitionerId, Guid.NewGuid)
                .RuleFor(p => p.UserId, Guid.NewGuid)
                .RuleFor(p => p.FirstName, f => f.Name.FirstName())
                .RuleFor(p => p.LastName, f => f.Name.LastName())
                .RuleFor(p => p.IsActive, true)
                .RuleFor(p => p.IsCareNavigator, false)
                .RuleFor(p => p.IsSupportingClinician, true)
                .RuleFor(p => p.Position, PractitionerPosition.Physician)
                .Generate(5);

            // Add the System Admin explicitly as a practitioner for testing
            var adminPractitioner = new Practitioner
            {
                PractitionerId = Guid.NewGuid(),
                FirstName = "System",
                LastName = "Admin",
                IsActive = true,
                IsCareNavigator = true,
                Position = PractitionerPosition.Nurse
            };

            var practitioners = careNavigators.Concat(supportingClinicians).Append(adminPractitioner).ToList();
            
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
                        Longitude = faker.Address.Longitude(-111.95, -111.85)
                    }
                };
                context.EntityAddresses.Add(entityAddr);
            }

            context.Practitioners.AddRange(practitioners);
            await context.SaveChangesAsync();

            // ==========================================
            // TRANSACTIONAL TABLES (10 Records Each)
            // ==========================================
            var patients = new Faker<Patient>()
                .RuleFor(p => p.PatientId, Guid.NewGuid)
                .RuleFor(p => p.FirstName, f => f.Name.FirstName())
                .RuleFor(p => p.LastName, f => f.Name.LastName())
                .RuleFor(p => p.Mrn, f => $"MRN-{f.IndexGlobal + 50000}") // FIX: Guarantee uniqueness
                .RuleFor(
                    p => p.Dob,
                    f => f.Date.Past(80, DateTime.UtcNow.AddYears(-20)).ToUniversalTime()
                )
                .RuleFor(p => p.BiologicalSex, f => f.PickRandom("Male", "Female"))
                .RuleFor(p => p.HealthPlanId, f => f.PickRandom(healthPlans).HealthPlanId)
                .RuleFor(p => p.FacilityId, f => f.PickRandom(facilities).FacilityId)
                .RuleFor(
                    p => p.PhilhealthNumber,
                    f => $"PH-{f.IndexGlobal}-{f.Random.Number(1000, 9999)}"
                )
                .Generate(10);
            context.Patients.AddRange(patients);
            await context.SaveChangesAsync();

            var patientOutreaches = new Faker<PatientOutreach>()
                .RuleFor(x => x.PatientOutreachId, Guid.NewGuid)
                .RuleFor(x => x.FirstName, f => f.Name.FirstName())
                .RuleFor(x => x.LastName, f => f.Name.LastName())
                .RuleFor(x => x.Status, f => f.PickRandom<OutreachStatus>())
                .RuleFor(x => x.Disposition, f => f.PickRandom<EnrollmentDisposition>())
                .RuleFor(x => x.HealthPlanId, f => f.PickRandom(healthPlans).HealthPlanId)
                .Generate(10);
            context.Set<PatientOutreach>().AddRange(patientOutreaches);
            await context.SaveChangesAsync();

            var outreachContacts = new Faker<OutreachContact>()
                .RuleFor(x => x.OutreachContactId, Guid.NewGuid)
                .RuleFor(
                    x => x.PatientOutreachId,
                    f => f.PickRandom(patientOutreaches).PatientOutreachId
                )
                .RuleFor(x => x.FirstName, f => f.Name.FirstName())
                .RuleFor(x => x.LastName, f => f.Name.LastName())
                .RuleFor(x => x.Relationship, f => f.PickRandom<RelationshipType>())
                .Generate(10);
            context.Set<OutreachContact>().AddRange(outreachContacts);

            var outreachActivities = new Faker<OutreachActivity>()
                .RuleFor(x => x.OutreachActivityId, Guid.NewGuid)
                .RuleFor(x => x.OutreachId, f => f.PickRandom(patientOutreaches).PatientOutreachId)
                .RuleFor(x => x.PractitionerId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(x => x.Method, f => f.PickRandom<OutreachMethod>())
                .Generate(10);
            context.Set<OutreachActivity>().AddRange(outreachActivities);

            var patientContacts = new Faker<PatientContact>()
                .RuleFor(x => x.ContactId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.FirstName, f => f.Name.FirstName())
                .RuleFor(x => x.LastName, f => f.Name.LastName())
                .RuleFor(x => x.Relationship, f => f.PickRandom<RelationshipType>())
                .Generate(10);
            context.Set<PatientContact>().AddRange(patientContacts);

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
                        Latitude = f.Address.Latitude(39.0, 41.0),
                        Longitude = f.Address.Longitude(-113.0, -111.0)
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

            var diagnoses = new Faker<Diagnosis>()
                .RuleFor(x => x.DiagnosisId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.Icd10Code, f => f.Random.AlphaNumeric(5))
                .RuleFor(x => x.Description, f => f.Lorem.Sentence())
                .Generate(10);
            context.Set<Diagnosis>().AddRange(diagnoses);

            var allergies = new Faker<Allergy>()
                .RuleFor(x => x.AllergyId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.Allergen, f => f.Lorem.Word())
                .RuleFor(x => x.Severity, f => f.PickRandom<SeverityLevel>())
                .RuleFor(x => x.Reaction, f => f.Lorem.Word())
                .Generate(10);
            context.Set<Allergy>().AddRange(allergies);

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
                .RuleFor(a => a.Modality, f => {
                    var p = f.Random.Number(1, 100);
                    if (p <= 35) return AppointmentModality.InPersonFacility;
                    if (p <= 65) return AppointmentModality.InPersonHomeVisit;
                    if (p <= 80) return AppointmentModality.TelehealthVideo;
                    if (p <= 90) return AppointmentModality.TelehealthAudioOnly;
                    return AppointmentModality.Telephone;
                })
                // Sequential spacing: 4 appointments per day, exactly 2 hours apart (8AM, 10AM, 12PM, 2PM Local Time)
                .RuleFor(
                    a => a.ScheduledStart,
                    f => baseDate.AddDays(f.IndexFaker / 4).AddHours((f.IndexFaker % 4) * 2)
                )
                .RuleFor(a => a.ScheduledEnd, (f, a) => a.ScheduledStart.AddHours(1))
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

                        var patientAddr = context.EntityAddresses.Local
                            .FirstOrDefault(ea => ea.PatientId == a.PatientId);

                        // Final Consistency Fix: Use the actual GeoUtils math in the seeder
                        var pAddress = context.EntityAddresses.Local
                            .FirstOrDefault(ea => ea.PractitionerId == a.PractitionerId)?.Address;
                        
                        if (pAddress == null || !pAddress.Latitude.HasValue || patientAddr?.Address?.Latitude.HasValue != true)
                            return 15; // Minimum buffer fallback

                        var dist = Application.Common.Utils.GeoUtils.CalculateDistance(
                            pAddress.Latitude.Value, pAddress.Longitude.Value,
                            patientAddr.Address.Latitude.Value, patientAddr.Address.Longitude.Value);
                        
                        var time = Application.Common.Utils.GeoUtils.EstimateTravelTimeMinutes(dist);
                        return (int)Math.Max(15, Math.Round(time, 0));
                    }
                )
                .Generate(12); // Generate 12 to perfectly fill 3 days (4 per day)
            context.Appointments.AddRange(appointments);
            await context.SaveChangesAsync();

            var encounters = new Faker<ClinicalEncounter>()
                .RuleFor(e => e.EncounterId, Guid.NewGuid)
                .RuleFor(e => e.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(e => e.PractitionerId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(e => e.AppointmentId, (f, u) => f.PickRandom(appointments).AppointmentId)
                .RuleFor(e => e.Type, f => f.PickRandom<EncounterType>())
                .RuleFor(e => e.Status, f => f.PickRandom<EncounterStatus>())
                .RuleFor(e => e.PpsScore, f => f.Random.Number(30, 100))
                .Generate(10);
            context.Set<ClinicalEncounter>().AddRange(encounters);
            await context.SaveChangesAsync();

            var vitals = new Faker<VitalSign>()
                .RuleFor(v => v.VitalId, Guid.NewGuid)
                .RuleFor(v => v.EncounterId, (f, u) => f.PickRandom(encounters).EncounterId)
                .RuleFor(v => v.HeartRate, f => f.Random.Decimal(60, 110))
                .RuleFor(v => v.BloodPressureSystolic, f => f.Random.Decimal(100, 160))
                .RuleFor(v => v.RecordedAt, f => f.Date.RecentOffset(5).ToUniversalTime())
                .Generate(10);
            context.Set<VitalSign>().AddRange(vitals);

            var notes = new Faker<ClinicalNote>()
                .RuleFor(n => n.NoteId, Guid.NewGuid)
                .RuleFor(n => n.EncounterId, (f, u) => f.PickRandom(encounters).EncounterId)
                .RuleFor(n => n.AuthorId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(n => n.Type, f => f.PickRandom<NoteType>())
                .RuleFor(n => n.Subjective, f => f.Lorem.Paragraph())
                .Generate(10);
            context.Set<ClinicalNote>().AddRange(notes);

            var esas = new Faker<EsasAssessment>()
                .RuleFor(x => x.AssessmentId, Guid.NewGuid)
                .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                .RuleFor(x => x.EncounterId, (f, u) => f.PickRandom(encounters).EncounterId)
                .RuleFor(x => x.Pain, f => f.Random.Number(0, 10))
                .Generate(10);
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
            await context.SaveChangesAsync();

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

            var blocks = new List<ScheduleBlock>();
            // Generate clean, conflict-free busy blocks for each practitioner
            for (int i = 0; i < practitioners.Count; i++)
            {
                var p = practitioners[i];
                blocks.Add(new ScheduleBlock
                {
                    BlockId = Guid.NewGuid(),
                    PractitionerId = p.PractitionerId,
                    Status = ScheduleBlockStatus.Blocked,
                    // Place blocks late in the day (4PM-6PM) so they never overlap with the 8AM-2PM appointment slots
                    StartTime = baseDate.AddDays(i % 5).AddHours(16), 
                    EndTime = baseDate.AddDays(i % 5).AddHours(18)
                });
            }
            context.Set<ScheduleBlock>().AddRange(blocks);
            await context.SaveChangesAsync();

            var resources = new Faker<AppointmentResource>()
                .RuleFor(x => x.AppointmentId, (f, u) => f.PickRandom(appointments).AppointmentId)
                .RuleFor(x => x.BlockId, (f, u) => f.PickRandom(blocks).BlockId)
                .Generate(10);

            var distinctResources = resources
                .GroupBy(x => new { x.AppointmentId, x.BlockId })
                .Select(g => g.First())
                .ToList();
            context.Set<AppointmentResource>().AddRange(distinctResources);

            var shifts = new List<ProviderShift>();
            foreach (var p in practitioners)
            {
                for (int day = 1; day <= 5; day++) // Mon-Fri
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
            await context.SaveChangesAsync();

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
                ) // FIX
                .RuleFor(x => x.Status, f => f.PickRandom<InvoiceStatus>())
                .Generate(10);
            context.Set<BillingInvoice>().AddRange(invoices);

            await context.SaveChangesAsync();
        }
    }
}
