using System.Security.Claims;
using Bogus;
using Domain.Common;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data
{
    public static class DbInitializer
    {
        private static readonly Guid adminPractitionerId = new Guid(
            "c79b9090-6725-460d-8531-1554c46f6f96"
        );

        private static readonly Guid defaultTenantId = new Guid(
            "a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0"
        );

        private const int CLINICAL_IN_PERSON_BUFFER = 5;
        private const int CLINICAL_TELEHEALTH_BUFFER = 3;

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
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

            var adminPassword =
                configuration["SeedSettings:InitialAdminPassword"] ?? "Halkyone@Initial!2026";
            var practitionerPassword =
                configuration["SeedSettings:InitialPractitionerPassword"]
                ?? "HalcyonPractitioner@Initial!2026";

            await context.Database.MigrateAsync();

            var now = DateTimeOffset.UtcNow;
            Console.WriteLine($"[TACTICAL SEEDING] InitializeAsync started at {now}");

            if (wipeDb)
            {
                Console.WriteLine("[TACTICAL SEEDING] Wiping database...");
                await WipeDatabaseAsync(context);
            }

            if (!wipeDb && await context.Patients.IgnoreQueryFilters().AnyAsync())
            {
                if (seedDb)
                {
                    await SeedDatabaseAsync(context);
                }
                return;
            }

            await SeedIdentityAsync(
                context,
                userManager,
                roleManager,
                adminPassword,
                practitionerPassword
            );

            if (seedDb)
            {
                await SeedDatabaseAsync(context);
            }
        }

        private static async Task SeedIdentityAsync(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            string adminPassword,
            string practitionerPassword
        )
        {
            var rolePermissions = new Dictionary<string, string[]>
            {
                { Roles.Admin, GetAllPermissions() },
                {
                    Roles.MedicalDirector,
                    new[]
                    {
                        Permissions.Patients.View,
                        Permissions.Patients.Edit,
                        Permissions.Patients.Enrollment,
                        Permissions.Clinical.View,
                        Permissions.Clinical.Order,
                        Permissions.Clinical.Chart,
                        Permissions.Clinical.Assessments,
                        Permissions.Scheduling.View,
                        Permissions.Logistics.View,
                        Permissions.Documentation.View,
                        Permissions.Documentation.Edit,
                        Permissions.Documentation.Sign,
                        Permissions.Pharmacy.View,
                        Permissions.Pharmacy.Order,
                        Permissions.Pharmacy.Audit,
                        Permissions.Analytics.View,
                        Permissions.Analytics.Export,
                    }
                },
                {
                    Roles.CareNavigator,
                    new[]
                    {
                        Permissions.Patients.View,
                        Permissions.Patients.Edit,
                        Permissions.Patients.Enrollment,
                        Permissions.Clinical.View,
                        Permissions.Scheduling.View,
                        Permissions.Scheduling.Manage,
                        Permissions.Logistics.View,
                        Permissions.Documentation.View,
                    }
                },
                {
                    Roles.Nurse,
                    new[]
                    {
                        Permissions.Patients.View,
                        Permissions.Clinical.View,
                        Permissions.Clinical.Chart,
                        Permissions.Clinical.Assessments,
                        Permissions.Scheduling.View,
                        Permissions.Documentation.View,
                        Permissions.Documentation.Edit,
                        Permissions.Documentation.Sign,
                        Permissions.Pharmacy.View,
                    }
                },
                {
                    Roles.SocialWorker,
                    new[]
                    {
                        Permissions.Patients.View,
                        Permissions.Clinical.View,
                        Permissions.Clinical.Assessments,
                        Permissions.Scheduling.View,
                        Permissions.Documentation.View,
                        Permissions.Documentation.Edit,
                    }
                },
                {
                    Roles.Chaplain,
                    new[]
                    {
                        Permissions.Patients.View,
                        Permissions.Clinical.View,
                        Permissions.Clinical.Assessments,
                        Permissions.Scheduling.View,
                        Permissions.Documentation.View,
                        Permissions.Documentation.Edit,
                    }
                },
                {
                    Roles.AdminCoordinator,
                    new[]
                    {
                        Permissions.Patients.View,
                        Permissions.Scheduling.View,
                        Permissions.Scheduling.Manage,
                        Permissions.Billing.View,
                        Permissions.Logistics.View,
                        Permissions.Analytics.View,
                    }
                },
                {
                    Roles.Practitioner,
                    new[]
                    {
                        Permissions.Patients.View,
                        Permissions.Clinical.View,
                        Permissions.Scheduling.View,
                        Permissions.Documentation.View,
                    }
                },
            };

            foreach (var rp in rolePermissions)
            {
                var role = await roleManager.FindByNameAsync(rp.Key);
                if (role == null)
                {
                    role = new IdentityRole(rp.Key);
                    await roleManager.CreateAsync(role);
                }

                var existingClaims = await roleManager.GetClaimsAsync(role);
                foreach (var permission in rp.Value)
                {
                    if (!existingClaims.Any(c => c.Type == "permission" && c.Value == permission))
                    {
                        await roleManager.AddClaimAsync(role, new Claim("permission", permission));
                    }
                }
            }

            if (
                !await context
                    .TenantConfigurations.IgnoreQueryFilters()
                    .AnyAsync(t => t.TenantId == defaultTenantId)
            )
            {
                context.TenantConfigurations.Add(
                    new TenantConfiguration
                    {
                        TenantId = defaultTenantId,
                        OrganizationName = "Halkyone Clinical",
                        Currency = "PHP",
                        Timezone = "Asia/Manila",
                        Language = "en",
                        DateFormat = "MM/DD/YYYY",
                        AmStartHour = 8,
                        PmStartHour = 13,
                        DayEndHour = 18,
                        EngineSafetyDriveMins = 5,
                    }
                );
                await context.SaveChangesAsync();
            }

            var allUsers = await userManager.Users.ToListAsync();
            foreach (var user in allUsers)
            {
                bool updated = false;
                if (user.TenantId == null || user.TenantId == Guid.Empty)
                {
                    user.TenantId = defaultTenantId;
                    updated = true;
                }

                var claims = await userManager.GetClaimsAsync(user);
                if (!claims.Any(c => c.Type == "tenantId"))
                {
                    await userManager.AddClaimAsync(
                        user,
                        new Claim("tenantId", defaultTenantId.ToString())
                    );
                }

                if (updated)
                {
                    await userManager.UpdateAsync(user);
                }
            }

            var adminEmail = "admin@palliative.emr";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString(),
                    UserName = adminEmail,
                    Email = adminEmail,
                    FirstName = "Erwin Wilson",
                    LastName = "Ceniza",
                    EmailConfirmed = true,
                    PractitionerId = adminPractitionerId,
                    TenantId = defaultTenantId,
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, Roles.Admin);
                }
            }
            else
            {
                if (!adminUser.PractitionerId.HasValue || adminUser.PractitionerId == Guid.Empty)
                {
                    adminUser.PractitionerId = adminPractitionerId;
                    await userManager.UpdateAsync(adminUser);
                }
            }

            var existingAdminPractitioner = await context
                .Practitioners.IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.UserId == Guid.Parse(adminUser.Id));

            if (
                existingAdminPractitioner != null
                && existingAdminPractitioner.PractitionerId == Guid.Empty
            )
            {
                context.Practitioners.Remove(existingAdminPractitioner);
                await context.SaveChangesAsync(default);
                existingAdminPractitioner = null;
            }

            if (existingAdminPractitioner == null)
            {
                var adminPractitioner = new Practitioner
                {
                    PractitionerId = adminPractitionerId,
                    TenantId = defaultTenantId,
                    FirstName = "Erwin Wilson",
                    LastName = "Ceniza",
                    UserId = new Guid(adminUser.Id),
                    Position = PractitionerPosition.Admin,
                    IsActive = true,
                    IsCareNavigator = true,
                    IsSupportingClinician = false,
                };
                context.Practitioners.Add(adminPractitioner);

                var adminAddr = new EntityAddress
                {
                    EntityAddressId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    PractitionerId = adminPractitionerId,
                    IsPrimary = true,
                    Type = AddressType.Home,
                    Address = new Address
                    {
                        Street = "Gorordo Avenue",
                        City = "Cebu City",
                        State = "Cebu",
                        PostalCode = "6000",
                        Latitude = 10.3157,
                        Longitude = 123.8854,
                        Country = "Philippines",
                    },
                };
                context.EntityAddresses.Add(adminAddr);
            }

            var practitionerAccounts = new[]
            {
                new
                {
                    Email = "cn.garcia@palliative.emr",
                    First = "Maria",
                    Last = "Garcia",
                    Role = Roles.CareNavigator,
                    Position = PractitionerPosition.Admin,
                    IsCareNavigator = true,
                    IsSupportingClinician = false,
                },
                new
                {
                    Email = "cn.santos@palliative.emr",
                    First = "Juan",
                    Last = "Santos",
                    Role = Roles.CareNavigator,
                    Position = PractitionerPosition.Admin,
                    IsCareNavigator = true,
                    IsSupportingClinician = false,
                },
                new
                {
                    Email = "cn.reyes@palliative.emr",
                    First = "Elena",
                    Last = "Reyes",
                    Role = Roles.CareNavigator,
                    Position = PractitionerPosition.Admin,
                    IsCareNavigator = true,
                    IsSupportingClinician = false,
                },
                new
                {
                    Email = "cn.lopez@palliative.emr",
                    First = "Ricardo",
                    Last = "Lopez",
                    Role = Roles.CareNavigator,
                    Position = PractitionerPosition.Admin,
                    IsCareNavigator = true,
                    IsSupportingClinician = false,
                },
                new
                {
                    Email = "cn.perez@palliative.emr",
                    First = "Antonio",
                    Last = "Perez",
                    Role = Roles.CareNavigator,
                    Position = PractitionerPosition.Admin,
                    IsCareNavigator = true,
                    IsSupportingClinician = false,
                },
                new
                {
                    Email = "dr.house@palliative.emr",
                    First = "Gregory",
                    Last = "House",
                    Role = Roles.MedicalDirector,
                    Position = PractitionerPosition.Physician,
                    IsCareNavigator = false,
                    IsSupportingClinician = true,
                },
                new
                {
                    Email = "dr.wilson@palliative.emr",
                    First = "James",
                    Last = "Wilson",
                    Role = Roles.Chaplain,
                    Position = PractitionerPosition.Physician,
                    IsCareNavigator = false,
                    IsSupportingClinician = true,
                },
                new
                {
                    Email = "dr.grey@palliative.emr",
                    First = "Meredith",
                    Last = "Grey",
                    Role = Roles.Nurse,
                    Position = PractitionerPosition.Physician,
                    IsCareNavigator = false,
                    IsSupportingClinician = true,
                },
                new
                {
                    Email = "dr.murphy@palliative.emr",
                    First = "Shaun",
                    Last = "Murphy",
                    Role = Roles.Practitioner,
                    Position = PractitionerPosition.Physician,
                    IsCareNavigator = false,
                    IsSupportingClinician = true,
                },
                new
                {
                    Email = "dr.dorian@palliative.emr",
                    First = "John",
                    Last = "Dorian",
                    Role = Roles.Practitioner,
                    Position = PractitionerPosition.Physician,
                    IsCareNavigator = false,
                    IsSupportingClinician = true,
                },
                new
                {
                    Email = "dr.yang@palliative.emr",
                    First = "Cristina",
                    Last = "Yang",
                    Role = Roles.Practitioner,
                    Position = PractitionerPosition.Physician,
                    IsCareNavigator = false,
                    IsSupportingClinician = true,
                },
                new
                {
                    Email = "dr.mccoy@palliative.emr",
                    First = "Leonard",
                    Last = "McCoy",
                    Role = Roles.Practitioner,
                    Position = PractitionerPosition.Physician,
                    IsCareNavigator = false,
                    IsSupportingClinician = true,
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
                        TenantId = defaultTenantId,
                    };

                    var result = await userManager.CreateAsync(user, practitionerPassword);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, acc.Role);
                    }
                }
                else
                {
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

                var existingPractitioner = await context
                    .Practitioners.IgnoreQueryFilters()
                    .Include(p => p.Addresses)
                        .ThenInclude(a => a.Address)
                    .FirstOrDefaultAsync(p => p.UserId == Guid.Parse(user.Id));

                if (
                    existingPractitioner != null
                    && (
                        existingPractitioner.PractitionerId == Guid.Empty
                        || existingPractitioner.PractitionerId
                            == Guid.Parse("00000000-0000-0000-0000-000000000000")
                    )
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
                        TenantId = defaultTenantId,
                        UserId = Guid.Parse(user.Id),
                        FirstName = acc.First,
                        LastName = acc.Last,
                        IsActive = true,
                        IsCareNavigator = acc.IsCareNavigator,
                        IsSupportingClinician = acc.IsSupportingClinician,
                        Position = acc.Position,
                    };

                    var locations = new[]
                    {
                        new
                        {
                            City = "Cebu City",
                            State = "Cebu",
                            Zip = "6000",
                            Lat = 10.3157,
                            Lon = 123.8854,
                            Var = 0.03,
                        },
                        new
                        {
                            City = "Mandaue City",
                            State = "Cebu",
                            Zip = "6014",
                            Lat = 10.3450,
                            Lon = 123.9444,
                            Var = 0.02,
                        },
                        new
                        {
                            City = "Lapu-Lapu City",
                            State = "Cebu",
                            Zip = "6015",
                            Lat = 10.3111,
                            Lon = 123.9493,
                            Var = 0.04,
                        },
                        new
                        {
                            City = "Talisay City",
                            State = "Cebu",
                            Zip = "6045",
                            Lat = 10.2447,
                            Lon = 123.8483,
                            Var = 0.02,
                        },
                        new
                        {
                            City = "Carcar City",
                            State = "Cebu",
                            Zip = "6019",
                            Lat = 10.1086,
                            Lon = 123.6403,
                            Var = 0.05,
                        },
                        new
                        {
                            City = "Argao",
                            State = "Cebu",
                            Zip = "6021",
                            Lat = 9.8833,
                            Lon = 123.6000,
                            Var = 0.05,
                        },
                        new
                        {
                            City = "Santander",
                            State = "Cebu",
                            Zip = "6026",
                            Lat = 9.4200,
                            Lon = 123.3300,
                            Var = 0.03,
                        },
                        new
                        {
                            City = "Danao City",
                            State = "Cebu",
                            Zip = "6004",
                            Lat = 10.5222,
                            Lon = 124.0292,
                            Var = 0.03,
                        },
                        new
                        {
                            City = "Bogo City",
                            State = "Cebu",
                            Zip = "6010",
                            Lat = 11.0500,
                            Lon = 124.0000,
                            Var = 0.05,
                        },
                        new
                        {
                            City = "Daanbantayan",
                            State = "Cebu",
                            Zip = "6013",
                            Lat = 11.2333,
                            Lon = 123.9833,
                            Var = 0.05,
                        },
                        new
                        {
                            City = "Toledo City",
                            State = "Cebu",
                            Zip = "6038",
                            Lat = 10.3800,
                            Lon = 123.6300,
                            Var = 0.06,
                        },
                        new
                        {
                            City = "Balamban",
                            State = "Cebu",
                            Zip = "6041",
                            Lat = 10.5000,
                            Lon = 123.7167,
                            Var = 0.04,
                        },
                    };
                    var loc = locations[new Random().Next(locations.Length)];

                    var entityAddr = new EntityAddress
                    {
                        EntityAddressId = Guid.NewGuid(),
                        TenantId = defaultTenantId,
                        PractitionerId = pId,
                        IsPrimary = true,
                        Type = AddressType.Home,
                        Address = new Address
                        {
                            Street =
                                new Random().Next(1, 100)
                                + " "
                                + new Faker().PickRandom(
                                    new[]
                                    {
                                        "Osmeña Blvd",
                                        "Escario St",
                                        "Gorordo Ave",
                                        "Colon St",
                                        "Mango Ave",
                                        "M.C. Briones St",
                                        "A.S. Fortuna St",
                                        "Hernan Cortes St",
                                        "Plaridel St",
                                        "V. Rama Ave",
                                        "B. Rodriguez St",
                                        "Salinas Dr",
                                        "Banilad Rd",
                                        "Juan Luna Ave",
                                    }
                                ),
                            City = loc.City,
                            State = "Cebu",
                            PostalCode = loc.Zip,
                            Latitude =
                                loc.Lat + (new Random().NextDouble() * loc.Var * 2 - loc.Var),
                            Longitude =
                                loc.Lon + (new Random().NextDouble() * loc.Var * 2 - loc.Var),
                            Country = "Philippines",
                        },
                    };

                    practitioner.Addresses.Add(entityAddr);
                    context.Practitioners.Add(practitioner);
                }
                else if (!existingPractitioner.Addresses.Any())
                {
                    var locations = new[]
                    {
                        new
                        {
                            City = "Cebu City",
                            State = "Cebu",
                            Zip = "6000",
                            Lat = 10.3157,
                            Lon = 123.8854,
                            Var = 0.03,
                        },
                        new
                        {
                            City = "Mandaue City",
                            State = "Cebu",
                            Zip = "6014",
                            Lat = 10.3450,
                            Lon = 123.9444,
                            Var = 0.02,
                        },
                        new
                        {
                            City = "Lapu-Lapu City",
                            State = "Cebu",
                            Zip = "6015",
                            Lat = 10.3111,
                            Lon = 123.9493,
                            Var = 0.04,
                        },
                        new
                        {
                            City = "Talisay City",
                            State = "Cebu",
                            Zip = "6045",
                            Lat = 10.2447,
                            Lon = 123.8483,
                            Var = 0.02,
                        },
                        new
                        {
                            City = "Carcar City",
                            State = "Cebu",
                            Zip = "6019",
                            Lat = 10.1086,
                            Lon = 123.6403,
                            Var = 0.05,
                        },
                        new
                        {
                            City = "Toledo City",
                            State = "Cebu",
                            Zip = "6038",
                            Lat = 10.3800,
                            Lon = 123.6300,
                            Var = 0.06,
                        },
                        new
                        {
                            City = "Danao City",
                            State = "Cebu",
                            Zip = "6004",
                            Lat = 10.5222,
                            Lon = 124.0292,
                            Var = 0.03,
                        },
                    };
                    var loc = locations[new Random().Next(locations.Length)];

                    var entityAddr = new EntityAddress
                    {
                        EntityAddressId = Guid.NewGuid(),
                        TenantId = defaultTenantId,
                        PractitionerId = existingPractitioner.PractitionerId,
                        IsPrimary = true,
                        Type = AddressType.Home,
                        Address = new Address
                        {
                            Street =
                                new Random().Next(1, 100)
                                + " "
                                + new Faker().PickRandom(
                                    new[]
                                    {
                                        "Osmeña Blvd",
                                        "Escario St",
                                        "Gorordo Ave",
                                        "Colon St",
                                        "Mango Ave",
                                        "M.C. Briones St",
                                        "A.S. Fortuna St",
                                        "Hernan Cortes St",
                                        "Plaridel St",
                                        "V. Rama Ave",
                                        "B. Rodriguez St",
                                        "Salinas Dr",
                                        "Banilad Rd",
                                        "Juan Luna Ave",
                                    }
                                ),
                            City = loc.City,
                            State = "Cebu",
                            PostalCode = loc.Zip,
                            Latitude =
                                loc.Lat + (new Random().NextDouble() * loc.Var * 2 - loc.Var),
                            Longitude =
                                loc.Lon + (new Random().NextDouble() * loc.Var * 2 - loc.Var),
                            Country = "Philippines",
                        },
                    };
                    existingPractitioner.Addresses.Add(entityAddr);
                }
            }

            await context.SaveChangesAsync(default);

            await SeedProviderShiftsAsync(context, defaultTenantId);
        }

        private static async Task SeedProviderShiftsAsync(
            ApplicationDbContext context,
            Guid tenantId
        )
        {
            if (await context.ProviderShifts.IgnoreQueryFilters().AnyAsync())
                return;

            var practitioners = await context.Practitioners.IgnoreQueryFilters().ToListAsync();
            foreach (var p in practitioners)
            {
                for (int i = 1; i < 7; i++)
                {
                    context.ProviderShifts.Add(
                        new ProviderShift
                        {
                            ProviderShiftId = Guid.NewGuid(),
                            TenantId = tenantId,
                            PractitionerId = p.PractitionerId,
                            DayOfWeek = (DayOfWeek)i,
                            StartTime = new TimeSpan(8, 0, 0),
                            EndTime = new TimeSpan(18, 0, 0),
                            IsActive = true,
                        }
                    );
                }
            }
            await context.SaveChangesAsync();
        }

        public static async Task WipeDatabaseAsync(ApplicationDbContext context)
        {
            var tableNames = context
                .Model.GetEntityTypes()
                .Select(t => t.GetTableName())
                .Distinct()
                .Where(t => !string.IsNullOrEmpty(t))
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
            await SeedQuestionnairesAsync(context);
            await context.SaveChangesAsync(default);

            Randomizer.Seed = new Random(8675309);
            var faker = new Faker();

            var allPractitioners = await context.Practitioners.IgnoreQueryFilters().ToListAsync();
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

            if (!await context.Patients.IgnoreQueryFilters().AnyAsync())
            {
                var healthPlans = new Faker<HealthPlan>()
                    .RuleFor(x => x.HealthPlanId, Guid.NewGuid)
                    .RuleFor(x => x.TenantId, defaultTenantId)
                    .RuleFor(x => x.Name, f => f.Company.CompanyName() + " Health")
                    .RuleFor(x => x.Code, f => f.Random.String2(5))
                    .Generate(5);
                context.Set<HealthPlan>().AddRange(healthPlans);

                var facilities = new Faker<Facility>()
                    .RuleFor(x => x.FacilityId, Guid.NewGuid)
                    .RuleFor(x => x.TenantId, defaultTenantId)
                    .RuleFor(x => x.Name, f => f.Company.CompanyName() + " Medical Center")
                    .RuleFor(x => x.Type, f => f.PickRandom<FacilityType>())
                    .Generate(5);
                context.Set<Facility>().AddRange(facilities);

                var dme = new Faker<DurableMedicalEquipment>()
                    .RuleFor(x => x.EquipmentId, Guid.NewGuid)
                    .RuleFor(x => x.TenantId, defaultTenantId)
                    .RuleFor(
                        x => x.SerialNumber,
                        f => $"SN-{f.IndexGlobal}-{f.Random.AlphaNumeric(5)}"
                    )
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

                faker = new Faker();
                foreach (var p in practitioners)
                {
                    var tacticalAreas = new[]
                    {
                        "Cebu City",
                        "Mandaue City",
                        "Lapu-Lapu City",
                        "Consolacion",
                        "Liloan",
                    };
                    var area = tacticalAreas[new Random().Next(tacticalAreas.Length)];

                    var entityAddr = new EntityAddress
                    {
                        EntityAddressId = Guid.NewGuid(),
                        TenantId = defaultTenantId,
                        PractitionerId = p.PractitionerId,
                        IsPrimary = true,
                        Type = AddressType.Home,
                        Address = new Address
                        {
                            Street =
                                faker.Random.Number(1, 100)
                                + " "
                                + faker.PickRandom(
                                    new[]
                                    {
                                        "Osmeña Blvd",
                                        "Escario St",
                                        "Gorordo Ave",
                                        "Colon St",
                                        "Mango Ave",
                                        "M.C. Briones St",
                                        "A.S. Fortuna St",
                                        "Hernan Cortes St",
                                        "Plaridel St",
                                        "V. Rama Ave",
                                        "B. Rodriguez St",
                                        "Salinas Dr",
                                        "Banilad Rd",
                                        "Juan Luna Ave",
                                    }
                                ),
                            City = area,
                            State = "Cebu",
                            Country = "Philippines",
                            PostalCode = "6000",
                            Latitude =
                                area == "Cebu City"
                                    ? 10.3157 + (new Random().NextDouble() * 0.02 - 0.01)
                                    : 10.35 + (new Random().NextDouble() * 0.05 - 0.025),
                            Longitude =
                                area == "Cebu City"
                                    ? 123.8854 + (new Random().NextDouble() * 0.02 - 0.01)
                                    : 123.95 + (new Random().NextDouble() * 0.05 - 0.025),
                        },
                    };
                    context.EntityAddresses.Add(entityAddr);
                }

                await context.SaveChangesAsync(default);

                var patients = new Faker<Patient>()
                    .RuleFor(p => p.PatientId, f => Guid.NewGuid())
                    .RuleFor(p => p.TenantId, f => defaultTenantId)
                    .RuleFor(p => p.FirstName, f => f.Name.FirstName())
                    .RuleFor(p => p.LastName, f => f.Name.LastName())
                    .RuleFor(p => p.Mrn, f => $"MRN-{f.IndexGlobal + 50000}")
                    .RuleFor(
                        p => p.Dob,
                        f => f.Date.Past(80, DateTime.UtcNow.AddYears(-20)).ToUniversalTime()
                    )
                    .RuleFor(p => p.BiologicalSex, f => f.PickRandom<BiologicalSex>())
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
                    .RuleFor(p => p.ConsentToTreat, f => true)
                    .RuleFor(p => p.ConsentHIPAA, f => true)
                    .RuleFor(p => p.ConsentMarketing, f => f.Random.Bool())
                    .RuleFor(
                        p => p.TriageNote,
                        f =>
                            f.Random.Bool(0.3f)
                                ? f.PickRandom(
                                    new[]
                                    {
                                        "Reporting severe breakthrough pain in lower extremities.",
                                        "Oxygen saturation dipping during exertion. Family concerned.",
                                        "New onset agitation and restlessness noted by caregiver.",
                                        "Requires medication titration for terminal secretions.",
                                        "Initial triage: Stable, but needs symptom follow-up within 24h.",
                                    }
                                )
                                : null
                    )
                    .RuleFor(p => p.InterpreterRequired, f => false)
                    .RuleFor(p => p.PreferredContactMethod, f => "PHONE")
                    .Generate(10);
                context.Patients.AddRange(patients);

                var pearline = new Patient
                {
                    PatientId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    FirstName = "Pearline",
                    LastName = "Bauch",
                    Mrn = "MRN-99999",
                    Dob = new DateTime(1955, 5, 10, 0, 0, 0, DateTimeKind.Utc),
                    BiologicalSex = BiologicalSex.Female,
                    CivilStatus = "Widowed",
                    Religion = "Catholic",
                    Nationality = "Filipino",
                    Language = "English",
                    HealthPlanId = healthPlans[0].HealthPlanId,
                    FacilityId = facilities[0].FacilityId,
                    ConsentToTreat = true,
                    ConsentHIPAA = true,
                    PreferredContactMethod = "PHONE",
                };
                context.Patients.Add(pearline);
                patients.Add(pearline);

                context
                    .Set<PatientPhone>()
                    .Add(
                        new PatientPhone
                        {
                            PhoneId = Guid.NewGuid(),
                            TenantId = defaultTenantId,
                            PatientId = pearline.PatientId,
                            PhoneNumber = "1-222-674-4040 x19731",
                            Type = AddressType.Mobile,
                            IsPrimary = true,
                        }
                    );

                var pearlineAddr = new EntityAddress
                {
                    EntityAddressId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    PatientId = pearline.PatientId,
                    IsPrimary = true,
                    Type = AddressType.Home,
                    Address = new Address
                    {
                        Street = "Banilad Road",
                        City = "Cebu City",
                        State = "Cebu",
                        PostalCode = "6000",
                        Latitude = 10.3446,
                        Longitude = 123.9114,
                        Country = "Philippines",
                    },
                };
                pearline.Addresses.Add(pearlineAddr);
                context.EntityAddresses.Add(pearlineAddr);

                await context.SaveChangesAsync(default);

                var patientContacts = new List<PatientContact>();
                foreach (var p in patients)
                {
                    patientContacts.Add(
                        new PatientContact
                        {
                            ContactId = Guid.NewGuid(),
                            PatientId = p.PatientId,
                            TenantId = defaultTenantId,
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

                    patientContacts.Add(
                        new PatientContact
                        {
                            ContactId = Guid.NewGuid(),
                            PatientId = p.PatientId,
                            TenantId = defaultTenantId,
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

                    patientContacts.Add(
                        new PatientContact
                        {
                            ContactId = Guid.NewGuid(),
                            PatientId = p.PatientId,
                            TenantId = defaultTenantId,
                            FirstName = faker.Name.FirstName(),
                            LastName = faker.Name.LastName(),
                            Relationship = RelationshipType.LegalRepresentative,
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

                var poaDocuments = patientContacts
                    .Where(c => c.HasPowerOfAttorney)
                    .Select(c => new PatientDocument
                    {
                        PatientDocumentId = Guid.NewGuid(),
                        PatientId = c.PatientId,
                        TenantId = defaultTenantId,
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
                    .UseSeed(8888)
                    .RuleFor(x => x.PatientOutreachId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.FirstName, f => f.Name.FirstName())
                    .RuleFor(x => x.LastName, f => f.Name.LastName())
                    .RuleFor(x => x.Status, f => f.PickRandom<OutreachStatus>())
                    .RuleFor(x => x.Disposition, f => f.PickRandom<EnrollmentDisposition>())
                    .RuleFor(
                        x => x.DateOfBirth,
                        f => f.Date.Past(80, DateTime.UtcNow.AddYears(-20))
                    )
                    .RuleFor(x => x.BiologicalSex, f => f.PickRandom<BiologicalSex>())
                    .RuleFor(
                        x => x.GenderIdentity,
                        f => f.PickRandom(new[] { "Cisgender", "Non-binary", null })
                    )
                    .RuleFor(x => x.Language, f => f.PickRandom("English", "Spanish", "Tagalog"))
                    .RuleFor(x => x.CivilStatus, f => f.PickRandom("Single", "Married", "Widowed"))
                    .RuleFor(x => x.HealthPlanId, f => f.PickRandom(healthPlans).HealthPlanId)
                    .RuleFor(x => x.PrimaryPhone, f => f.Phone.PhoneNumber("###-###-####"))
                    .RuleFor(x => x.PrimaryEmail, f => f.Internet.Email())
                    .RuleFor(
                        x => x.MailingAddress,
                        (f, u) =>
                        {
                            return new Address
                            {
                                Street = f.PickRandom(
                                    "Salinas Dr",
                                    "Banilad Rd",
                                    "V. Rama Ave",
                                    "B. Rodriguez St"
                                ),
                                City = f.PickRandom("Cebu City", "Lapu-Lapu City", "Mandaue City"),
                                State = "Central Visayas",
                                PostalCode = f.Address.ZipCode(),
                                Latitude = f.Address.Latitude(10.15, 10.45),
                                Longitude = f.Address.Longitude(123.70, 124.00),
                            };
                        }
                    )
                    .Generate(10);
                var testLead = new PatientOutreach
                {
                    PatientOutreachId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    FirstName = "Christopher",
                    LastName = "Heard",
                    Status = OutreachStatus.Lead,
                    DateOfBirth = new DateTime(1990, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    BiologicalSex = BiologicalSex.Male,
                    MailingAddress = new Address
                    {
                        Street = "123 Test St",
                        City = "Cebu City",
                        State = "Central Visayas",
                        PostalCode = "6000",
                    },
                    PrimaryPhone = "555-0199",
                    Disposition = EnrollmentDisposition.Cooperative,
                };
                context.PatientOutreaches.Add(testLead);

                context.Set<PatientOutreach>().AddRange(patientOutreaches);
                await context.SaveChangesAsync(default);

                var outreachContacts = new Faker<OutreachContact>()
                    .RuleFor(x => x.OutreachContactId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(
                        x => x.PatientOutreachId,
                        (f, u) => f.PickRandom(patientOutreaches).PatientOutreachId
                    )
                    .RuleFor(x => x.FirstName, f => f.Name.FirstName())
                    .RuleFor(x => x.LastName, f => f.Name.LastName())
                    .RuleFor(x => x.Relationship, f => f.PickRandom<RelationshipType>())
                    .RuleFor(x => x.PhoneNumber, f => f.Phone.PhoneNumber("###-###-####"))
                    .Generate(10);
                context.Set<OutreachContact>().AddRange(outreachContacts);

                var outreachActivities = new Faker<OutreachActivity>()
                    .RuleFor(x => x.OutreachActivityId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(
                        x => x.OutreachId,
                        (f, u) => f.PickRandom(patientOutreaches).PatientOutreachId
                    )
                    .RuleFor(x => x.PractitionerId, f => f.PickRandom(practitioners).PractitionerId)
                    .RuleFor(x => x.Method, f => f.PickRandom<OutreachMethod>())
                    .RuleFor(
                        x => x.Outcome,
                        f =>
                            f.PickRandom(
                                "NO_ANSWER",
                                "INTERESTED",
                                "LEFT_VOICEMAIL",
                                "WRONG_NUMBER"
                            )
                    )
                    .RuleFor(x => x.Notes, f => f.Lorem.Sentence())
                    .RuleFor(x => x.ActivityDate, f => f.Date.RecentOffset(5).ToUniversalTime())
                    .Generate(10);
                context.Set<OutreachActivity>().AddRange(outreachActivities);

                var patientPhones = new Faker<PatientPhone>()
                    .RuleFor(x => x.PhoneId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.PatientId, (f, u) => f.PickRandom(patients).PatientId)
                    .RuleFor(x => x.PhoneNumber, f => f.Phone.PhoneNumber())
                    .Generate(patients.Count);
                context.Set<PatientPhone>().AddRange(patientPhones);

                var entityAddresses = new Faker<EntityAddress>()
                    .RuleFor(x => x.EntityAddressId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(
                        x => x.PatientId,
                        (f, u) => patients[f.IndexFaker % patients.Count].PatientId
                    )
                    .RuleFor(x => x.IsPrimary, true)
                    .RuleFor(
                        x => x.Address,
                        (f, u) =>
                        {
                            var locations = new[]
                            {
                                new
                                {
                                    City = "Cebu City",
                                    State = "Cebu",
                                    Zip = "6000",
                                    Lat = 10.3157,
                                    Lon = 123.8854,
                                    Var = 0.03,
                                },
                                new
                                {
                                    City = "Mandaue City",
                                    State = "Cebu",
                                    Zip = "6014",
                                    Lat = 10.3450,
                                    Lon = 123.9444,
                                    Var = 0.02,
                                },
                                new
                                {
                                    City = "Lapu-Lapu City",
                                    State = "Cebu",
                                    Zip = "6015",
                                    Lat = 10.3111,
                                    Lon = 123.9493,
                                    Var = 0.04,
                                },
                                new
                                {
                                    City = "Talisay City",
                                    State = "Cebu",
                                    Zip = "6045",
                                    Lat = 10.2447,
                                    Lon = 123.8483,
                                    Var = 0.02,
                                },
                                new
                                {
                                    City = "Minglanilla",
                                    State = "Cebu",
                                    Zip = "6046",
                                    Lat = 10.2458,
                                    Lon = 123.7972,
                                    Var = 0.02,
                                },
                                new
                                {
                                    City = "Carcar City",
                                    State = "Cebu",
                                    Zip = "6019",
                                    Lat = 10.1086,
                                    Lon = 123.6403,
                                    Var = 0.05,
                                },
                                new
                                {
                                    City = "Argao",
                                    State = "Cebu",
                                    Zip = "6021",
                                    Lat = 9.8833,
                                    Lon = 123.6000,
                                    Var = 0.05,
                                },
                                new
                                {
                                    City = "Consolacion",
                                    State = "Cebu",
                                    Zip = "6001",
                                    Lat = 10.3833,
                                    Lon = 123.9667,
                                    Var = 0.03,
                                },
                                new
                                {
                                    City = "Liloan",
                                    State = "Cebu",
                                    Zip = "6002",
                                    Lat = 10.4000,
                                    Lon = 124.0000,
                                    Var = 0.03,
                                },
                                new
                                {
                                    City = "Danao City",
                                    State = "Cebu",
                                    Zip = "6004",
                                    Lat = 10.5222,
                                    Lon = 124.0292,
                                    Var = 0.03,
                                },
                                new
                                {
                                    City = "Bogo City",
                                    State = "Cebu",
                                    Zip = "6010",
                                    Lat = 11.0500,
                                    Lon = 124.0000,
                                    Var = 0.05,
                                },
                                new
                                {
                                    City = "Toledo City",
                                    State = "Cebu",
                                    Zip = "6038",
                                    Lat = 10.3800,
                                    Lon = 123.6300,
                                    Var = 0.06,
                                },
                                new
                                {
                                    City = "Balamban",
                                    State = "Cebu",
                                    Zip = "6041",
                                    Lat = 10.5000,
                                    Lon = 123.7167,
                                    Var = 0.04,
                                },
                            };
                            var loc = locations[f.Random.Number(locations.Length - 1)];

                            return new Address
                            {
                                Street =
                                    f.Random.Number(1, 999)
                                    + " "
                                    + f.PickRandom(
                                        new[]
                                        {
                                            "A.S. Fortuna St",
                                            "Hernan Cortes St",
                                            "Plaridel St",
                                            "S.B. Cabahug St",
                                            "Osmeña Blvd",
                                            "V. Rama Ave",
                                            "B. Rodriguez St",
                                            "Salinas Dr",
                                            "Banilad Rd",
                                            "Lopez Jaena St",
                                            "P. del Rosario St",
                                            "Jakosalem St",
                                            "Magallanes St",
                                            "F. Ramos St",
                                            "Ranudo St",
                                            "Echavez St",
                                            "Sikatuna St",
                                            "T. Padilla St",
                                        }
                                    ),
                                City = loc.City,
                                State = "Cebu",
                                Country = "Philippines",
                                PostalCode = loc.Zip,
                                Latitude = loc.Lat + f.Random.Double(-loc.Var, loc.Var),
                                Longitude = loc.Lon + f.Random.Double(-loc.Var, loc.Var),
                            };
                        }
                    )
                    .Generate(patients.Count);
                context.Set<EntityAddress>().AddRange(entityAddresses);

                var patientEmails = new Faker<PatientEmail>()
                    .RuleFor(x => x.EmailId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.PatientId, (f, u) => f.PickRandom(patients).PatientId)
                    .RuleFor(x => x.EmailAddress, f => f.Internet.Email())
                    .Generate(10);
                context.Set<PatientEmail>().AddRange(patientEmails);

                var advanceDirectives = new Faker<AdvanceDirective>()
                    .RuleFor(x => x.AdvanceDirectiveId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.PatientId, (f, u) => f.PickRandom(patients).PatientId)
                    .RuleFor(x => x.Type, f => f.PickRandom<DirectiveType>())
                    .RuleFor(x => x.EffectiveDate, f => f.Date.PastOffset().ToUniversalTime())
                    .Generate(10);
                context.Set<AdvanceDirective>().AddRange(advanceDirectives);

                var diagnosesList = new Faker<Diagnosis>()
                    .RuleFor(x => x.DiagnosisId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                    .RuleFor(x => x.Icd10Code, f => f.Random.AlphaNumeric(5))
                    .RuleFor(x => x.Description, f => f.Lorem.Sentence())
                    .Generate(10);
                context.Set<Diagnosis>().AddRange(diagnosesList);

                var allergiesList = new Faker<Allergy>()
                    .RuleFor(x => x.AllergyId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.PatientId, f => f.PickRandom(patients).PatientId)
                    .RuleFor(x => x.Allergen, f => f.Lorem.Word())
                    .RuleFor(x => x.Severity, f => f.PickRandom<SeverityLevel>())
                    .RuleFor(x => x.Reaction, f => f.Lorem.Word())
                    .Generate(10);
                context.Set<Allergy>().AddRange(allergiesList);
                var now = DateTimeOffset.UtcNow;
                int diff = -(int)now.DayOfWeek;
                var baseDate = new DateTimeOffset(now.AddDays(diff).Date, TimeSpan.Zero);
                Console.WriteLine(
                    $"[TACTICAL SEEDING] Current-Week baseDate: {baseDate:yyyy-MM-dd}"
                );

                var allAppointments = new List<Appointment>();
                var allAddresses = await context
                    .EntityAddresses.Include(ea => ea.Address)
                    .IgnoreQueryFilters()
                    .ToListAsync();

                double GetDistance(Guid pId, Guid patId, AppointmentModality mod)
                {
                    if (
                        mod != AppointmentModality.InPersonHomeVisit
                        && mod != AppointmentModality.InPersonFacility
                    )
                        return 0.0;

                    var pA = allAddresses.FirstOrDefault(ea => ea.PractitionerId == pId)?.Address;
                    var ptA = allAddresses.FirstOrDefault(ea => ea.PatientId == patId)?.Address;

                    if (pA == null || ptA == null)
                        return 5.0;

                    var distance = Application.Common.Utils.GeoUtils.CalculateDistance(
                        pA.Latitude ?? 10.3157,
                        pA.Longitude ?? 123.8854,
                        ptA.Latitude ?? 10.3157,
                        ptA.Longitude ?? 123.8854
                    );

                    return Math.Max(distance, 0.5);
                }

                int GetTravelTime(double dist, AppointmentModality mod, Faker f)
                {
                    if (
                        mod != AppointmentModality.InPersonHomeVisit
                        && mod != AppointmentModality.InPersonFacility
                    )
                        return 0;
                    var baseT = Application.Common.Utils.GeoUtils.EstimateTravelTimeMinutes(dist);
                    return (int)Math.Clamp(baseT * f.Random.Double(1.2, 2.5), 2, 60);
                }

                // Dynamically calculate offset based on Tenant's configured business timezone
                var tenantConfig = await context.TenantConfigurations.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.TenantId == defaultTenantId);
                var tzId = tenantConfig?.Timezone ?? "UTC";
                var tz = TimeZoneInfo.FindSystemTimeZoneById(tzId);
                var localOffset = tz.GetUtcOffset(DateTime.UtcNow);
                // Atomic clear to prevent any ghost data
                await context.Database.ExecuteSqlRawAsync("DELETE FROM appointments");
                
                var pracsToSeed = practitioners != null && practitioners.Any() 
                    ? practitioners 
                    : await context.Practitioners.IgnoreQueryFilters().ToListAsync();
                
                var uniquePracs = pracsToSeed.GroupBy(p => p.PractitionerId).Select(g => g.First()).ToList();
                var eligibleSupporters = uniquePracs.Where(p => p.IsSupportingClinician || p.IsCareNavigator).ToList();

                // Track busy windows: Dictionary<Day, Dictionary<PractitionerId, List<(Start, End)>>>
                var busyWindows = new Dictionary<int, Dictionary<Guid, List<(DateTimeOffset, DateTimeOffset)>>>();

                for (int dayOffset = 0; dayOffset < 7; dayOffset++)
                {
                    var currentDate = baseDate.AddDays(dayOffset);
                    if (currentDate.DayOfWeek == DayOfWeek.Sunday) continue;

                    busyWindows[dayOffset] = new Dictionary<Guid, List<(DateTimeOffset, DateTimeOffset)>>();
                    foreach (var p in uniquePracs) busyWindows[dayOffset][p.PractitionerId] = new List<(DateTimeOffset, DateTimeOffset)>();

                    for (int pIdx = 0; pIdx < uniquePracs.Count; pIdx++)
                    {
                        var leadPrac = uniquePracs[pIdx];
                        if (leadPrac.PractitionerId == Guid.Empty) continue;
                        if (pIdx >= uniquePracs.Count - 3) continue; // Skip 3 for empty test

                        var sessions = new[] { 8, 13 }; // 8 AM and 1 PM
                        foreach (var hour in sessions)
                        {
                            var currentTime = new DateTimeOffset(currentDate.Year, currentDate.Month, currentDate.Day, hour, 0, 0, localOffset);
                            int apptsInSession = hour == 8 ? 2 : 1;

                            for (int i = 0; i < apptsInSession; i++)
                            {
                                var patient = patients[faker.Random.Number(patients.Count - 1)];
                                var modality = faker.PickRandom<AppointmentModality>();
                                double dist = GetDistance(leadPrac.PractitionerId, patient.PatientId, modality);
                                int driveTime = GetTravelTime(dist, modality, faker);
                                int buffer = (modality == AppointmentModality.TelehealthVideo) ? 15 : 30;

                                currentTime = currentTime.AddMinutes(buffer + driveTime);
                                int minutesToNext15 = (15 - (currentTime.Minute % 15)) % 15;
                                var start = currentTime.AddMinutes(minutesToNext15);
                                var duration = faker.Random.Number(30, 60);
                                var end = start.AddMinutes(duration);

                                if (end.Hour >= (hour == 8 ? 12 : 17)) break;

                                // Check if LEAD is busy (shouldn't be, but good for safety)
                                if (busyWindows[dayOffset][leadPrac.PractitionerId].Any(w => start < w.Item2 && end > w.Item1))
                                {
                                    currentTime = end;
                                    continue;
                                }

                                var appt = new Appointment
                                {
                                    AppointmentId = Guid.NewGuid(),
                                    TenantId = defaultTenantId,
                                    PatientId = patient.PatientId,
                                    PractitionerId = leadPrac.PractitionerId,
                                    VisitType = faker.PickRandom<VisitType>(),
                                    Status = AppointmentStatus.Scheduled,
                                    Modality = modality,
                                    ScheduledStart = start.ToUniversalTime(),
                                    ScheduledEnd = end.ToUniversalTime(),
                                    DistanceInMiles = dist,
                                    TravelTimeMinutes = driveTime,
                                    SupportingClinicians = new List<Practitioner>()
                                };

                                // Add 0-1 Supporting Clinician who is NOT busy
                                if (faker.Random.Bool(0.4f))
                                {
                                    var potentialSupporter = faker.PickRandom(eligibleSupporters);
                                    if (potentialSupporter.PractitionerId != leadPrac.PractitionerId)
                                    {
                                        var isBusy = busyWindows[dayOffset][potentialSupporter.PractitionerId].Any(w => start < w.Item2 && end > w.Item1);
                                        if (!isBusy)
                                        {
                                            appt.SupportingClinicians.Add(potentialSupporter);
                                            busyWindows[dayOffset][potentialSupporter.PractitionerId].Add((start, end));
                                        }
                                    }
                                }

                                allAppointments.Add(appt);
                                busyWindows[dayOffset][leadPrac.PractitionerId].Add((start, end));
                                currentTime = end;
                            }
                        }
                    }
                }

                context.Appointments.AddRange(allAppointments);
                await context.SaveChangesAsync(default);

                var meds = context.Set<Medication>().Local.ToList();

                foreach (var p in patients)
                {
                    var pAllergies = new Faker<Allergy>()
                        .RuleFor(a => a.PatientId, p.PatientId)
                        .RuleFor(a => a.TenantId, defaultTenantId)
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

                    var pDiagnoses = new Faker<Diagnosis>()
                        .RuleFor(d => d.PatientId, p.PatientId)
                        .RuleFor(d => d.TenantId, defaultTenantId)
                        .RuleFor(
                            d => d.Icd10Code,
                            f =>
                                f.PickRandom(new[] { "C34.90", "I50.9", "E11.9", "J44.9", "F32.9" })
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
                                    "F32.9" =>
                                        "Major depressive disorder, single episode, unspecified",
                                    _ => "General Diagnosis",
                                }
                        )
                        .RuleFor(d => d.IsPrimary, f => f.IndexFaker == 0)
                        .Generate(new Random().Next(1, 4));
                    context.Set<Diagnosis>().AddRange(pDiagnoses);

                    var pPrescriptions = new Faker<Prescription>()
                        .RuleFor(pr => pr.PatientId, p.PatientId)
                        .RuleFor(pr => pr.TenantId, defaultTenantId)
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

                if (!await context.ClinicalEncounters.IgnoreQueryFilters().AnyAsync())
                {
                    var allEncounters = new List<ClinicalEncounter>();
                    foreach (var p in patients)
                    {
                        var pEncounters = new Faker<ClinicalEncounter>()
                            .RuleFor(e => e.EncounterId, Guid.NewGuid)
                            .RuleFor(e => e.TenantId, defaultTenantId)
                            .RuleFor(e => e.PatientId, p.PatientId)
                            .RuleFor(
                                e => e.PractitionerId,
                                f =>
                                    f.PickRandom(
                                        practitioners
                                            .Where(pr => pr.Position != PractitionerPosition.Admin)
                                            .Select(pr => pr.PractitionerId)
                                            .ToList()
                                    )
                            )
                            .RuleFor(
                                e => e.AppointmentId,
                                f => (Guid?)f.PickRandom(allAppointments).AppointmentId
                            )
                            .RuleFor(e => e.Type, f => f.PickRandom<EncounterType>())
                            .RuleFor(
                                e => e.Status,
                                (f, e) =>
                                {
                                    return f.Random.WeightedRandom(
                                        new[]
                                        {
                                            EncounterStatus.Completed,
                                            EncounterStatus.InProgress,
                                            EncounterStatus.Arrived,
                                        },
                                        new[] { 0.7f, 0.2f, 0.1f }
                                    );
                                }
                            )
                            .RuleFor(e => e.PpsScore, f => f.Random.Number(30, 90))
                            .RuleFor(
                                e => e.EncounterDate,
                                f => f.Date.RecentOffset(1).ToUniversalTime()
                            )
                            .Generate(10);
                        allEncounters.AddRange(pEncounters);
                    }
                    context.ClinicalEncounters.AddRange(allEncounters);
                    await context.SaveChangesAsync(default);

                    var vitals = new List<VitalSign>();
                    foreach (var e in allEncounters)
                    {
                        var count = new Random().Next(1, 3);
                        for (int i = 0; i < count; i++)
                        {
                            var v = new VitalSign
                            {
                                VitalId = Guid.NewGuid(),
                                TenantId = defaultTenantId,
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

                var encountersList = await context
                    .ClinicalEncounters.IgnoreQueryFilters()
                    .ToListAsync();

                var clinicalSummaries = new[]
                {
                    "Patient alert and oriented. Breathing unlabored on room air. Pain well-controlled with current regimen.",
                    "Medication reconciliation completed with family. No new changes to prescription list.",
                    "Wound care performed on lower left extremity. No signs of infection noted. Dressing replaced.",
                    "Conducted psychosocial assessment. Patient and family expressing adequate coping mechanisms.",
                    "Emergency triage visit. Respiratory status stabilized after nebulizer treatment. Monitoring continues.",
                    "Initial hospice intake. Comprehensive assessment performed. Patient comfortable and resting.",
                    "Bereavement follow-up. Family provided with counseling resources. Support group recommended.",
                    "Patient experiencing mild nausea. Adjusted PRN medications. Family educated on monitoring.",
                    "Advanced care planning discussed. All documents reviewed and signed by legal guardian.",
                    "Routine symptom management visit. Vital signs stable. Patient reporting improved appetite.",
                    "Spiritual assessment completed. Chaplain referral initiated per patient request.",
                    "Respiratory status monitored. O2 saturation stable at 98% on 2L NC. Patient resting comfortably.",
                    "Safety assessment of home environment completed. Recommendations provided for fall prevention.",
                    "Caregiver education provided regarding pain management protocol. Understanding demonstrated.",
                    "Psychosocial support provided. Patient expressed concerns regarding transition of care. Validated.",
                };

                var notes = new Faker<ClinicalNote>()
                    .RuleFor(n => n.NoteId, Guid.NewGuid)
                    .RuleFor(n => n.TenantId, defaultTenantId)
                    .RuleFor(n => n.EncounterId, (f, u) => f.PickRandom(encountersList).EncounterId)
                    .RuleFor(n => n.AuthorId, f => f.PickRandom(practitioners).PractitionerId)
                    .RuleFor(n => n.Type, f => f.PickRandom<NoteType>())
                    .RuleFor(n => n.Content, f => f.PickRandom(clinicalSummaries))
                    .Generate(encountersList.Count);
                context.Set<ClinicalNote>().AddRange(notes);

                var esas = new Faker<EsasAssessment>()
                    .RuleFor(x => x.AssessmentId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.PatientId, (f, u) => f.PickRandom(patients).PatientId)
                    .RuleFor(x => x.EncounterId, (f, u) => f.PickRandom(encountersList).EncounterId)
                    .RuleFor(
                        x => x.Pain,
                        f =>
                            f.Random.WeightedRandom(
                                new[] { 0, 3, 5, 8, 10 },
                                new[] { 0.2f, 0.3f, 0.3f, 0.15f, 0.05f }
                            )
                    )
                    .RuleFor(x => x.Nausea, f => f.Random.Number(0, 10))
                    .RuleFor(x => x.ShortnessOfBreath, f => f.Random.Number(0, 10))
                    .RuleFor(x => x.Tiredness, f => f.Random.Number(0, 10))
                    .RuleFor(x => x.Drowsiness, f => f.Random.Number(0, 10))
                    .RuleFor(x => x.LackOfAppetite, f => f.Random.Number(0, 10))
                    .RuleFor(
                        x => x.Wellbeing,
                        f =>
                            f.Random.WeightedRandom(
                                new[] { 0, 3, 5, 8, 10 },
                                new[] { 0.2f, 0.3f, 0.3f, 0.15f, 0.05f }
                            )
                    )
                    .RuleFor(x => x.Anxiety, f => f.Random.Number(0, 10))
                    .RuleFor(x => x.Depression, f => f.Random.Number(0, 10))
                    .RuleFor(x => x.AssessedAt, f => f.Date.RecentOffset(30).ToUniversalTime())
                    .Generate(100);
                context.Set<EsasAssessment>().AddRange(esas);

                var deliveries = new Faker<EquipmentDelivery>()
                    .RuleFor(x => x.DeliveryId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.EquipmentId, f => f.PickRandom(dme).EquipmentId)
                    .RuleFor(x => x.PatientId, (f, u) => f.PickRandom(patients).PatientId)
                    .RuleFor(x => x.Status, f => f.PickRandom<DeliveryStatus>())
                    .Generate(10);
                context.Set<EquipmentDelivery>().AddRange(deliveries);

                var telemetry = new Faker<TelemetryLog>()
                    .RuleFor(x => x.LogId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.EquipmentId, f => f.PickRandom(dme).EquipmentId)
                    .RuleFor(x => x.Value, f => f.Random.Decimal(1, 100))
                    .RuleFor(x => x.RecordedAt, f => f.Date.RecentOffset().ToUniversalTime())
                    .Generate(10);
                context.Set<TelemetryLog>().AddRange(telemetry);

                var cases = new Faker<CareNavigationCase>()
                    .RuleFor(x => x.CaseId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.PatientId, (f, u) => f.PickRandom(patients).PatientId)
                    .RuleFor(x => x.NavigatorId, f => f.PickRandom(practitioners).PractitionerId)
                    .RuleFor(x => x.Status, f => f.PickRandom<CaseStatus>())
                    .RuleFor(x => x.AcuityLevel, f => f.PickRandom<AcuityLevel>())
                    .Generate(10);
                context.Set<CareNavigationCase>().AddRange(cases);
                await context.SaveChangesAsync(default);

                var barriers = new Faker<BarrierLog>()
                    .RuleFor(x => x.BarrierId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.CaseId, (f, u) => f.PickRandom(cases).CaseId)
                    .RuleFor(x => x.BarrierCategory, f => f.Lorem.Word())
                    .Generate(10);
                context.Set<BarrierLog>().AddRange(barriers);

                var navTasks = new Faker<NavigationTask>()
                    .RuleFor(x => x.TaskId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.CaseId, (f, u) => f.PickRandom(cases).CaseId)
                    .RuleFor(x => x.AssignedToId, f => f.PickRandom(practitioners).PractitionerId)
                    .RuleFor(x => x.Status, f => f.PickRandom<NavigationTaskStatus>())
                    .Generate(10);
                context.Set<NavigationTask>().AddRange(navTasks);

                var interventions = new Faker<InterventionLog>()
                    .RuleFor(x => x.InterventionId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.CaseId, (f, u) => f.PickRandom(cases).CaseId)
                    .RuleFor(x => x.ActionTaken, f => f.Lorem.Sentence())
                    .Generate(10);
                context.Set<InterventionLog>().AddRange(interventions);

                var sdoh = new Faker<SdohAssessment>()
                    .RuleFor(x => x.SdohId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.CaseId, (f, u) => f.PickRandom(cases).CaseId)
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
                                TenantId = defaultTenantId,
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
                    .RuleFor(x => x.LicensureId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.PractitionerId, f => f.PickRandom(practitioners).PractitionerId)
                    .RuleFor(x => x.LicenseNumber, f => f.Random.AlphaNumeric(8))
                    .Generate(10);
                context.Set<PractitionerLicensure>().AddRange(licenses);
                await context.SaveChangesAsync(default);
            }

            var patientsRegistry = await context.Patients.IgnoreQueryFilters().ToListAsync();
            if (!patientsRegistry.Any())
                return;

            var areas = new Faker<PractitionerServiceArea>()
                .RuleFor(x => x.ServiceAreaId, f => Guid.NewGuid())
                .RuleFor(x => x.TenantId, f => defaultTenantId)
                .RuleFor(x => x.PractitionerId, f => f.PickRandom(practitioners).PractitionerId)
                .RuleFor(x => x.ZipCode, f => f.Address.ZipCode())
                .Generate(10);
            context.Set<PractitionerServiceArea>().AddRange(areas);

            if (!await context.Set<BillingInvoice>().IgnoreQueryFilters().AnyAsync())
            {
                var claims = new Faker<ZBenefitClaim>()
                    .RuleFor(x => x.ClaimId, f => Guid.NewGuid())
                    .RuleFor(x => x.TenantId, f => defaultTenantId)
                    .RuleFor(x => x.PatientId, f => f.PickRandom(patientsRegistry).PatientId)
                    .RuleFor(x => x.PhilhealthNumber, f => f.Random.Replace("##-#########-#"))
                    .RuleFor(
                        x => x.PackageCode,
                        f => f.PickRandom(new[] { "Z001", "Z002", "Z003", "Z004" })
                    )
                    .RuleFor(x => x.Status, f => f.PickRandom<ClaimStatus>())
                    .RuleFor(x => x.TotalAmount, f => f.Finance.Amount(5000, 15000))
                    .RuleFor(x => x.SubmittedAt, f => f.Date.RecentOffset(10).ToUniversalTime())
                    .Generate(5);
                context.Set<ZBenefitClaim>().AddRange(claims);
                await context.SaveChangesAsync(default);

                var invoices = new List<BillingInvoice>();
                for (int i = 0; i < 6; i++)
                {
                    var hasClaim = i < 3;
                    var patient = patientsRegistry[i % patientsRegistry.Count];
                    var claim = hasClaim ? claims[i % claims.Count] : null;

                    var subtotal = (decimal)faker.Random.Number(1000, 5000);
                    var covered = hasClaim ? subtotal * 0.8m : 0;

                    var inv = new BillingInvoice
                    {
                        InvoiceId = Guid.NewGuid(),
                        TenantId = defaultTenantId,
                        PatientId = patient.PatientId,
                        ClaimId = claim?.ClaimId,
                        InvoiceNumber = $"INV-{2026}{faker.Random.Number(1000, 9999)}",
                        Status = faker.PickRandom<InvoiceStatus>(),
                        SubtotalAmount = subtotal,
                        CoveredAmount = covered,
                        PatientResponsibility = subtotal - covered,
                        GeneratedAt = DateTimeOffset.UtcNow.AddDays(-faker.Random.Number(1, 15)),
                        DueDate = DateTimeOffset.UtcNow.AddDays(faker.Random.Number(15, 30)),
                    };
                    invoices.Add(inv);
                }
                context.Set<BillingInvoice>().AddRange(invoices);
                await context.SaveChangesAsync(default);

                var invoiceItems = new List<BillingInvoiceItem>();
                var serviceNames = new[]
                {
                    "Palliative Consultation",
                    "Pain Management Protocol",
                    "Home Health Assessment",
                    "Oxygen Support",
                    "Wound Care",
                };

                foreach (var inv in invoices)
                {
                    var itemCount = faker.Random.Number(1, 4);
                    for (int j = 0; j < itemCount; j++)
                    {
                        var qty = faker.Random.Number(1, 3);
                        var itemUnitPrice = (inv.SubtotalAmount / itemCount) / qty;
                        invoiceItems.Add(
                            new BillingInvoiceItem
                            {
                                ItemId = Guid.NewGuid(),
                                TenantId = defaultTenantId,
                                InvoiceId = inv.InvoiceId,
                                Description = faker.PickRandom(serviceNames),
                                Quantity = qty,
                                UnitPrice = itemUnitPrice,
                                TotalPrice = qty * itemUnitPrice,
                            }
                        );
                    }
                }
                context.Set<BillingInvoiceItem>().AddRange(invoiceItems);
                await context.SaveChangesAsync(default);
            }

            var scripts = new List<OutreachScript>
            {
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Standard Orientation Script",
                    LocationName = "Mandaue City",
                    PostalCode = "84101",
                    Content =
                        "Hello, I am calling from the Halkyone Clinical Logistics Team. We've identified you as a candidate for our specialized health support services in the Mandaue region. Our goal is to verify your eligibility and schedule a diagnostic orientation at your convenience.",
                    IsDefault = true,
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Urgent Follow-up Protocol",
                    LocationName = "Mandaue City",
                    PostalCode = "84111",
                    Content =
                        "This is a priority follow-up regarding your recent health inquiry. We need to finalize your clinical orientation to ensure uninterrupted access to your care navigator and supporting clinical staff.",
                    IsDefault = false,
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Hospice Eligibility Mission",
                    LocationName = "Cebu City",
                    Content =
                        "Hello {firstName}, I am calling to confirm your eligibility for our hospice benefit program. We've received your referral and would like to explain how our team can support you and your family during this transition.",
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Assessment Deployment",
                    LocationName = "Lapu-Lapu City",
                    Content =
                        "Hi {firstName}, we are ready to deploy a clinician to your location for a comprehensive health assessment. Would {day} at {time} work for your schedule?",
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Caregiver Support Pulse",
                    LocationName = "Mandaue City",
                    Content =
                        "Hello, I'm calling to check in on the caregiver support systems. We want to ensure you have all the resources needed to maintain the care protocol at home.",
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "DME Logistics Sync",
                    LocationName = "Cebu City",
                    Content =
                        "This is Halkyone Logistics. We are confirming the delivery of your medical equipment scheduled for today. Our technician will arrive within the next 2 hours.",
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Post-Discharge Verification",
                    LocationName = "Mandaue City",
                    Content =
                        "Hello {firstName}, we've noted your recent discharge from the facility. We're calling to ensure your home care plan is fully synchronized and you have all your medications.",
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Insurance Alignment",
                    LocationName = "Region VII",
                    Content =
                        "Hi, we are updating our records regarding your health plan coverage. We want to ensure all clinical services remain fully covered under your current policy.",
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Community Resource Link",
                    LocationName = "Cebu City",
                    Content =
                        "Hello, following our recent discussion, we've identified several community resources that align with your needs. I'd like to share these details with you.",
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Bereavement Outreach",
                    LocationName = "Region VII",
                    Content =
                        "Hello, I am calling from the Halkyone Bereavement Team. We wanted to reach out and offer our support and resources during this difficult time.",
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Telehealth Tech Support",
                    LocationName = "Remote",
                    Content =
                        "Hi {firstName}, we have a scheduled video visit coming up. I'm calling to help you test your connection and ensure the platform is ready for the clinician.",
                },
                new OutreachScript
                {
                    OutreachScriptId = Guid.NewGuid(),
                    TenantId = defaultTenantId,
                    ScriptTitle = "Appointment Tactical Reminder",
                    LocationName = "Global",
                    Content =
                        "Strategic reminder: You have a clinical encounter scheduled for tomorrow at {time}. Please ensure the environment is ready for the practitioner's arrival.",
                },
            };
            context.Set<OutreachScript>().AddRange(scripts);
            await context.SaveChangesAsync(default);

            if (!await context.SmartPhrases.IgnoreQueryFilters().AnyAsync())
            {
                var phrases = new List<SmartPhrase>
                {
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/hpi",
                        TenantId = defaultTenantId,
                        Label = "History of Present Illness",
                        TemplateText =
                            "Chief Complaint: \nHistory: \nRelevant Symptoms: \nTimeline: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/soap",
                        TenantId = defaultTenantId,
                        Label = "SOAP Note Template",
                        TemplateText = "S: \nO: \nA: \nP: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/ros",
                        TenantId = defaultTenantId,
                        Label = "Review of Systems",
                        TemplateText =
                            "General: \nHEENT: \nRespiratory: \nCardiovascular: \nGastrointestinal: \nMusculoskeletal: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/pain",
                        TenantId = defaultTenantId,
                        Label = "Pain Assessment",
                        TemplateText =
                            "Intensity: /10\nCharacter: \nRadiation: \nAggravating Factors: \nRelieving Factors: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/phys",
                        TenantId = defaultTenantId,
                        Label = "Physical Exam (Brief)",
                        TemplateText =
                            "General: \nLungs: Clear to auscultation.\nHeart: RRR, no murmurs.\nAbdomen: Soft, non-tender.\nExtremities: No edema.",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/tele",
                        TenantId = defaultTenantId,
                        Label = "Telehealth Disclosure",
                        TemplateText =
                            "Patient consented to telehealth visit. Identity verified. Connection secure. Location: Home.",
                        Category = "Admin",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/death",
                        TenantId = defaultTenantId,
                        Label = "Death Pronouncement",
                        TemplateText =
                            "Date/Time of Death: \nCalled by: \nRespiration absent. Pulses absent. Pupils fixed/dilated. \nNotified: \nMortuary: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/code",
                        TenantId = defaultTenantId,
                        Label = "Code Status Discussion",
                        TemplateText =
                            "Status: [DNR/DNI/Full Code]\nDiscussion: Patient/Family understanding of prognosis and goals. Directives reviewed and updated.",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/dme",
                        TenantId = defaultTenantId,
                        Label = "Equipment Request",
                        TemplateText =
                            "Item: \nJustification: \nEstimated duration of use: \nDelivery Location: ",
                        Category = "Logistics",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/idre",
                        TenantId = defaultTenantId,
                        Label = "IDG Record Entry",
                        TemplateText =
                            "Interdisciplinary Group Review: \nGoals met: \nBarriers to care: \nPlan update: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/plan",
                        TenantId = defaultTenantId,
                        Label = "Care Plan Goals",
                        TemplateText =
                            "Short-term: \nLong-term: \nInterventions: \nMeasurable Outcome: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/fam",
                        TenantId = defaultTenantId,
                        Label = "Family Meeting Summary",
                        TemplateText =
                            "Attendees: \nDiscussion: \nDecisions made: \nFollow-up items: ",
                        Category = "Psychosocial",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/meds",
                        TenantId = defaultTenantId,
                        Label = "Medication Reconciliation",
                        TemplateText =
                            "Meds reviewed from home list vs system. \nChanges: \nEducation provided: \nPharmacy: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/wound",
                        TenantId = defaultTenantId,
                        Label = "Wound Assessment",
                        TemplateText = "Location: \nDimensions: \nStage: \nExudate: \nTreatment: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/intake",
                        TenantId = defaultTenantId,
                        Label = "Clinical Intake Summary",
                        TemplateText =
                            "Primary Diagnosis: \nSecondary Conditions: \nSocial support: \nFunctional status: ",
                        Category = "Clinical",
                    },
                    new SmartPhrase
                    {
                        PhraseId = Guid.NewGuid(),
                        Shortcut = "/discharge",
                        TenantId = defaultTenantId,
                        Label = "Transition/Discharge Summary",
                        TemplateText =
                            "Reason for transition: \nFinal assessment: \nHand-off to: \nEquipment retrieved: ",
                        Category = "Admin",
                    },
                };
                context.SmartPhrases.AddRange(phrases);
                await context.SaveChangesAsync(default);
            }

            await SeedNotificationsAsync(context);
        }

        private static async Task SeedQuestionnairesAsync(ApplicationDbContext context)
        {
            if (await context.Questionnaires.IgnoreQueryFilters().AnyAsync())
                return;

            var symptomInstruments = new List<Questionnaire>
            {
                new Questionnaire
                {
                    Name = "ESAS-R",
                    TenantId = defaultTenantId,
                    Description = "Edmonton Symptom Assessment System (Revised) - 9-item scale.",
                    AssessmentType = AssessmentType.Esas,
                },
                new Questionnaire
                {
                    Name = "BPI",
                    TenantId = defaultTenantId,
                    Description =
                        "Brief Pain Inventory - Evaluates pain severity and functional impact.",
                    AssessmentType = AssessmentType.Bpi,
                },
                new Questionnaire
                {
                    Name = "MSAS",
                    TenantId = defaultTenantId,
                    Description =
                        "Memorial Symptom Assessment Scale - Physical/psychological burden.",
                    AssessmentType = AssessmentType.Msas,
                },
                new Questionnaire
                {
                    Name = "VBPS",
                    TenantId = defaultTenantId,
                    Description = "Victoria Bowel Performance Scale - Constipation management.",
                    AssessmentType = AssessmentType.VictoriaBowel,
                },
            };
            context.Questionnaires.AddRange(symptomInstruments);

            var esas = symptomInstruments[0];
            var esasQuestions = new[]
            {
                "Pain",
                "Tiredness",
                "Drowsiness",
                "Nausea",
                "Lack of Appetite",
                "Shortness of Breath",
                "Depression",
                "Anxiety",
                "Overall Wellbeing",
            };
            for (int i = 0; i < esasQuestions.Length; i++)
            {
                context.Questions.Add(
                    new Question
                    {
                        Questionnaire = esas,
                        TenantId = defaultTenantId,
                        Text = esasQuestions[i],
                        Subtext = "0 = No Symptom | 10 = Worst Possible",
                        Type = QuestionType.Scale,
                        Order = i,
                    }
                );
            }

            var bpi = symptomInstruments[1];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = bpi,
                    TenantId = defaultTenantId,
                    Text = "Worst pain in last 24 hours",
                    Subtext = "0 (No Pain) - 10 (Worst)",
                    Type = QuestionType.Scale,
                    Order = 0,
                }
            );
            context.Questions.Add(
                new Question
                {
                    Questionnaire = bpi,
                    TenantId = defaultTenantId,
                    Text = "Average pain in last 24 hours",
                    Subtext = "0 (No Pain) - 10 (Worst)",
                    Type = QuestionType.Scale,
                    Order = 1,
                }
            );

            var vbps = symptomInstruments[3];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = vbps,
                    TenantId = defaultTenantId,
                    Text = "Bowel movement frequency",
                    OptionsJson =
                        "[\"Regular\", \"Decreased\", \"Constipated\", \"No BM > 3 days\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 0,
                }
            );

            var msas = symptomInstruments[2];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = msas,
                    TenantId = defaultTenantId,
                    Text = "Physical Symptom Burden",
                    Subtext = "Frequency/Severity of physical symptoms",
                    Type = QuestionType.Scale,
                    Order = 0,
                }
            );
            context.Questions.Add(
                new Question
                {
                    Questionnaire = msas,
                    TenantId = defaultTenantId,
                    Text = "Psychological Symptom Burden",
                    Subtext = "Distress from psychological symptoms",
                    Type = QuestionType.Scale,
                    Order = 1,
                }
            );

            var functionalInstruments = new List<Questionnaire>
            {
                new Questionnaire
                {
                    Name = "PPSv2",
                    TenantId = defaultTenantId,
                    Description = "Palliative Performance Scale - Functional Assessment.",
                    AssessmentType = AssessmentType.Pps,
                },
                new Questionnaire
                {
                    Name = "KPS",
                    TenantId = defaultTenantId,
                    Description =
                        "Karnofsky Performance Scale - Functional impairment classification (0-100).",
                    AssessmentType = AssessmentType.Kps,
                },
                new Questionnaire
                {
                    Name = "ECOG",
                    TenantId = defaultTenantId,
                    Description = "Eastern Cooperative Oncology Group Performance Status.",
                    AssessmentType = AssessmentType.Ecog,
                },
                new Questionnaire
                {
                    Name = "FAST",
                    TenantId = defaultTenantId,
                    Description = "Functional Assessment Staging Tool - Dementia progression.",
                    AssessmentType = AssessmentType.Fast,
                },
            };
            context.Questionnaires.AddRange(functionalInstruments);

            var pps = functionalInstruments[0];
            var ppsQuestions = new[]
            {
                new
                {
                    T = "Ambulation",
                    O = "[\"Full\", \"Reduced\", \"Mainly Sit/Lie\", \"Mainly Bed\", \"Totally Bed\"]",
                },
                new
                {
                    T = "Activity & Evidence of Disease",
                    O = "[\"Normal\", \"Normal / Minor Disease\", \"Normal / Some Disease\", \"Unable to do Job\", \"Extensive Disease\"]",
                },
                new
                {
                    T = "Self-Care",
                    O = "[\"Full\", \"Occasional Assistance\", \"Mainly Assistance\", \"Extensive Assistance\", \"Total Care\"]",
                },
                new
                {
                    T = "Intake",
                    O = "[\"Normal\", \"Normal / Reduced\", \"Minimal Sips\", \"Mouth Care Only\"]",
                },
                new
                {
                    T = "Level of Consciousness",
                    O = "[\"Full\", \"Full / Confusion\", \"Drowsy / Confusion\", \"Coma\"]",
                },
            };
            for (int i = 0; i < ppsQuestions.Length; i++)
            {
                context.Questions.Add(
                    new Question
                    {
                        Questionnaire = pps,
                        TenantId = defaultTenantId,
                        Text = ppsQuestions[i].T,
                        Type = QuestionType.MultipleChoice,
                        OptionsJson = ppsQuestions[i].O,
                        Order = i,
                    }
                );
            }

            var kps = functionalInstruments[1];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = kps,
                    TenantId = defaultTenantId,
                    Text = "Karnofsky Performance Status",
                    OptionsJson =
                        "[\"100% - Normal\", \"90% - Minor Symptoms\", \"80% - Effort required\", \"70% - Unable to carry on normal activity\", \"60% - Requires occasional assistance\", \"50% - Requires considerable assistance\", \"40% - Disabled\", \"30% - Severely disabled\", \"20% - Very sick\", \"10% - Moribund\", \"0% - Dead\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 0,
                }
            );

            var ecog = functionalInstruments[2];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = ecog,
                    TenantId = defaultTenantId,
                    Text = "Performance Status",
                    OptionsJson =
                        "[\"0 - Fully Active\", \"1 - Restricted Heavy Labor\", \"2 - Capable of Self-Care\", \"3 - Limited Self-Care\", \"4 - Completely Disabled\", \"5 - Dead\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 0,
                }
            );

            var fast = functionalInstruments[3];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = fast,
                    TenantId = defaultTenantId,
                    Text = "Functional Staging",
                    OptionsJson =
                        "[\"Stage 1 - Normal\", \"Stage 2 - Subjective Deficit\", \"Stage 3 - Early AD\", \"Stage 4 - Mild AD\", \"Stage 5 - Moderate AD\", \"Stage 6 - Moderately Severe AD\", \"Stage 7 - Severe AD\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 0,
                }
            );

            var psychInstruments = new List<Questionnaire>
            {
                new Questionnaire
                {
                    Name = "HADS",
                    TenantId = defaultTenantId,
                    Description = "Hospital Anxiety and Depression Scale.",
                    AssessmentType = AssessmentType.Hads,
                },
                new Questionnaire
                {
                    Name = "PHQ-9",
                    TenantId = defaultTenantId,
                    Description = "Patient Health Questionnaire-9 Depression Screening.",
                    AssessmentType = AssessmentType.Phq9,
                },
                new Questionnaire
                {
                    Name = "MMSE-MoCA",
                    TenantId = defaultTenantId,
                    Description = "Cognitive Assessment - Impairment and decision capacity.",
                    AssessmentType = AssessmentType.MmseMoca,
                },
            };
            context.Questionnaires.AddRange(psychInstruments);

            var hads = psychInstruments[0];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = hads,
                    TenantId = defaultTenantId,
                    Text = "Anxiety Score",
                    Subtext = "Combined score (0-21)",
                    Type = QuestionType.Scale,
                    Order = 0,
                }
            );
            context.Questions.Add(
                new Question
                {
                    Questionnaire = hads,
                    TenantId = defaultTenantId,
                    Text = "Depression Score",
                    Subtext = "Combined score (0-21)",
                    Type = QuestionType.Scale,
                    Order = 1,
                }
            );

            var phq9 = psychInstruments[1];
            var phq9Options =
                "[\"Not at all\", \"Several days\", \"More than half the days\", \"Nearly every day\"]";
            var phq9Questions = new[]
            {
                "Little interest or pleasure in doing things",
                "Feeling down, depressed, or hopeless",
                "Trouble falling or staying asleep, or sleeping too much",
                "Feeling tired or having little energy",
                "Poor appetite or overeating",
                "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
                "Trouble concentrating on things, such as reading the newspaper or watching television",
                "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
                "Thoughts that you would be better off dead or of hurting yourself in some way",
            };
            for (int i = 0; i < phq9Questions.Length; i++)
            {
                context.Questions.Add(
                    new Question
                    {
                        Questionnaire = phq9,
                        TenantId = defaultTenantId,
                        Text = phq9Questions[i],
                        Type = QuestionType.MultipleChoice,
                        OptionsJson = phq9Options,
                        Order = i,
                    }
                );
            }

            var mmse = psychInstruments[2];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = mmse,
                    TenantId = defaultTenantId,
                    Text = "Orientation to Time & Place",
                    OptionsJson =
                        "[\"Intact\", \"Mild Impairment\", \"Moderate Impairment\", \"Severe Impairment\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 0,
                }
            );
            context.Questions.Add(
                new Question
                {
                    Questionnaire = mmse,
                    TenantId = defaultTenantId,
                    Text = "Memory Recall (3 items)",
                    OptionsJson =
                        "[\"3 items recall\", \"2 items recall\", \"1 item recall\", \"0 items recall\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 1,
                }
            );

            var qolInstruments = new List<Questionnaire>
            {
                new Questionnaire
                {
                    Name = "MQOL",
                    TenantId = defaultTenantId,
                    Description = "McGill Quality of Life Questionnaire.",
                    AssessmentType = AssessmentType.Mqol,
                },
                new Questionnaire
                {
                    Name = "FACIT-PAL",
                    TenantId = defaultTenantId,
                    Description = "Functional Assessment of Chronic Illness Therapy.",
                    AssessmentType = AssessmentType.FacitPal,
                },
            };
            context.Questionnaires.AddRange(qolInstruments);
            context.Questions.Add(
                new Question
                {
                    Questionnaire = qolInstruments[0],
                    TenantId = defaultTenantId,
                    Text = "Overall Quality of Life",
                    Subtext = "How would you rate your life quality over the past 2 days?",
                    Type = QuestionType.Scale,
                    Order = 0,
                }
            );
            context.Questions.Add(
                new Question
                {
                    Questionnaire = qolInstruments[1],
                    TenantId = defaultTenantId,
                    Text = "Functional Well-being Score",
                    Subtext = "FACIT-Pal standardized score",
                    Type = QuestionType.Scale,
                    Order = 0,
                }
            );

            var spiritualInstruments = new List<Questionnaire>
            {
                new Questionnaire
                {
                    Name = "FICA",
                    TenantId = defaultTenantId,
                    Description = "FICA Spiritual History Tool.",
                    AssessmentType = AssessmentType.Fica,
                },
                new Questionnaire
                {
                    Name = "HOPE",
                    TenantId = defaultTenantId,
                    Description = "HOPE Questions - Meaning and practices.",
                    AssessmentType = AssessmentType.Hope,
                },
            };
            context.Questionnaires.AddRange(spiritualInstruments);

            var fica = spiritualInstruments[0];
            var ficaQuestions = new[]
            {
                new
                {
                    T = "[F] Faith, Belief, Meaning",
                    S = "Do you consider yourself spiritual or religious? What gives your life meaning?",
                },
                new
                {
                    T = "[I] Importance and Influence",
                    S = "How important are your beliefs to you? Do they influence how you care for yourself?",
                },
                new
                {
                    T = "[C] Community",
                    S = "Are you part of a spiritual or religious community? Is this of support to you?",
                },
                new
                {
                    T = "[A] Address in Care",
                    S = "How would you like me, your healthcare provider, to address these issues in your healthcare?",
                },
            };
            for (int i = 0; i < ficaQuestions.Length; i++)
            {
                context.Questions.Add(
                    new Question
                    {
                        Questionnaire = fica,
                        TenantId = defaultTenantId,
                        Text = ficaQuestions[i].T,
                        Subtext = ficaQuestions[i].S,
                        Type = QuestionType.Text,
                        Order = i,
                    }
                );
            }

            var hope = spiritualInstruments[1];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = hope,
                    TenantId = defaultTenantId,
                    Text = "Sources of Hope, meaning, comfort, strength",
                    Type = QuestionType.Text,
                    Order = 0,
                }
            );
            context.Questions.Add(
                new Question
                {
                    Questionnaire = hope,
                    TenantId = defaultTenantId,
                    Text = "Organized religion / Personal spirituality",
                    Type = QuestionType.Text,
                    Order = 1,
                }
            );

            var prognosticInstruments = new List<Questionnaire>
            {
                new Questionnaire
                {
                    Name = "PPI",
                    TenantId = defaultTenantId,
                    Description = "Palliative Prognostic Index.",
                    AssessmentType = AssessmentType.Ppi,
                },
                new Questionnaire
                {
                    Name = "PaP",
                    TenantId = defaultTenantId,
                    Description = "Palliative Prognostic Score.",
                    AssessmentType = AssessmentType.Pap,
                },
            };
            context.Questionnaires.AddRange(prognosticInstruments);
            context.Questions.Add(
                new Question
                {
                    Questionnaire = prognosticInstruments[0],
                    TenantId = defaultTenantId,
                    Text = "Estimated survival (clinician prediction)",
                    Subtext = "Predict based on current clinical status",
                    Type = QuestionType.Text,
                    Order = 0,
                }
            );
            context.Questions.Add(
                new Question
                {
                    Questionnaire = prognosticInstruments[1],
                    Text = "Palliative Prognostic Score (PaP)",
                    Subtext = "Clinical Prediction of Survival percentage",
                    Type = QuestionType.Scale,
                    Order = 0,
                }
            );

            var caregiverInstruments = new List<Questionnaire>
            {
                new Questionnaire
                {
                    Name = "ZBI",
                    Description = "Zarit Burden Interview - Family caregiver stress.",
                    AssessmentType = AssessmentType.Zbi,
                },
                new Questionnaire
                {
                    Name = "CSI",
                    Description =
                        "Caregiver Strain Index - Physical/emotional stress identification.",
                    AssessmentType = AssessmentType.Csi,
                },
            };
            context.Questionnaires.AddRange(caregiverInstruments);
            context.Questions.Add(
                new Question
                {
                    Questionnaire = caregiverInstruments[0],
                    Text = "Zarit Caregiver Burden Score",
                    Subtext = "Total score (0-88)",
                    Type = QuestionType.Scale,
                    Order = 0,
                }
            );

            var csi = caregiverInstruments[1];
            context.Questions.Add(
                new Question
                {
                    Questionnaire = csi,
                    Text = "Sleep is disturbed",
                    OptionsJson = "[\"Yes\", \"No\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 0,
                }
            );

            context.Questions.Add(
                new Question
                {
                    Questionnaire = csi,
                    Text = "It is a physical strain",
                    OptionsJson = "[\"Yes\", \"No\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 1,
                }
            );

            context.Questions.Add(
                new Question
                {
                    Questionnaire = csi,
                    Text = "It is confining",
                    OptionsJson = "[\"Yes\", \"No\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 2,
                }
            );

            context.Questions.Add(
                new Question
                {
                    Questionnaire = csi,
                    Text = "There have been family adjustments",
                    OptionsJson = "[\"Yes\", \"No\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 3,
                }
            );

            context.Questions.Add(
                new Question
                {
                    Questionnaire = csi,
                    Text = "There have been changes in personal plans",
                    OptionsJson = "[\"Yes\", \"No\"]",
                    Type = QuestionType.MultipleChoice,
                    Order = 4,
                }
            );
        }

        private static async Task SeedNotificationsAsync(ApplicationDbContext context)
        {
            if (await context.Notifications.IgnoreQueryFilters().AnyAsync())
                return;

            var adminUser = await context
                .Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email == "admin@palliative.emr");
            var adminId = adminUser?.Id;

            var notifications = new List<Notification>
            {
                new Notification
                {
                    NotificationId = Guid.NewGuid(),
                    Title = "System Maintenance",
                    Message = "Scheduled maintenance tonight at 10 PM PHT. Expect brief downtime.",
                    Priority = NotificationPriority.High,
                    Category = "System",
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-2),
                    IsRead = false,
                },
                new Notification
                {
                    NotificationId = Guid.NewGuid(),
                    Title = "Welcome to Halkyone",
                    Message =
                        "Your clinical operating system is ready. Explore the new dashboard features.",
                    Priority = NotificationPriority.Normal,
                    Category = "System",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                    IsRead = true,
                    ReadAt = DateTimeOffset.UtcNow.AddDays(-1).AddMinutes(5),
                },
            };

            if (adminId != null)
            {
                notifications.AddRange(
                    new[]
                    {
                        new Notification
                        {
                            NotificationId = Guid.NewGuid(),
                            UserId = adminId,
                            Title = "Urgent: High Pain Score",
                            Message =
                                "Patient Maria Santos (MRN-50042) reported a pain score of 9/10.",
                            Priority = NotificationPriority.Critical,
                            Category = "Clinical",
                            CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-15),
                            IsRead = false,
                            ActionUrl = "/patients/maria-santos",
                        },
                        new Notification
                        {
                            NotificationId = Guid.NewGuid(),
                            UserId = adminId,
                            Title = "New Appointment",
                            Message =
                                "You have a new telehealth visit scheduled for tomorrow at 2 PM.",
                            Priority = NotificationPriority.Normal,
                            Category = "Scheduling",
                            CreatedAt = DateTimeOffset.UtcNow.AddHours(-1),
                            IsRead = false,
                            ActionUrl = "/schedule",
                        },
                        new Notification
                        {
                            NotificationId = Guid.NewGuid(),
                            UserId = adminId,
                            Title = "Billing Alert",
                            Message = "Invoice #INV-2026-001 is overdue for processing.",
                            Priority = NotificationPriority.Urgent,
                            Category = "Billing",
                            CreatedAt = DateTimeOffset.UtcNow.AddHours(-4),
                            IsRead = false,
                        },
                    }
                );
            }

            context.Notifications.AddRange(notifications);
            await context.SaveChangesAsync();
        }

        private static string[] GetAllPermissions()
        {
            return new[]
            {
                Permissions.Patients.View,
                Permissions.Patients.Edit,
                Permissions.Patients.Delete,
                Permissions.Patients.Enrollment,
                Permissions.Clinical.View,
                Permissions.Clinical.Order,
                Permissions.Clinical.Chart,
                Permissions.Clinical.Assessments,
                Permissions.Scheduling.View,
                Permissions.Scheduling.Manage,
                Permissions.Billing.View,
                Permissions.Billing.Manage,
                Permissions.Setup.View,
                Permissions.Setup.Manage,
                Permissions.Logistics.View,
                Permissions.Logistics.Manage,
                Permissions.Documentation.View,
                Permissions.Documentation.Edit,
                Permissions.Documentation.Delete,
                Permissions.Documentation.Sign,
                Permissions.Pharmacy.View,
                Permissions.Pharmacy.Order,
                Permissions.Pharmacy.Audit,
                Permissions.Analytics.View,
                Permissions.Analytics.Export,
                Permissions.Integrations.View,
                Permissions.Integrations.Manage,
                Permissions.Integrations.Sync,
            };
        }
    }
}
