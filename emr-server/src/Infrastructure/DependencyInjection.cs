using Application.Common.Interfaces;
using Infrastructure.Data;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddSingleton<IDateTimeProvider, Infrastructure.Services.DateTimeProvider>();

        // Identity Configuration
        services.AddIdentity<ApplicationUser, IdentityRole>(options => {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 8;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        // Integrations
        services.AddHttpClient<IElationClient, Infrastructure.Integrations.Elation.ElationClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["Integrations:Elation:ApiUrl"] ?? "https://api.elationhealth.com/v1/");
        });

        services.AddHttpClient<ICareSourceClient, Infrastructure.Integrations.CareSource.CareSourceClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["Integrations:CareSource:ApiUrl"] ?? "https://api.caresource.com/v1/");
        });

        services.AddScoped<ISchedulingService, Infrastructure.Services.SchedulingService>();

        return services;
    }
}
