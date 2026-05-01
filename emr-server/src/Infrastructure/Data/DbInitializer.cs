using Domain.Entities;
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

        // 5. Seed Sample Patients
        if (!await context.Patients.AnyAsync())
        {
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
                    City = "Manila"
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
                    City = "Quezon City"
                }
            );
        }

        await context.SaveChangesAsync();
    }
}
