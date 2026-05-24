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
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddDbContextFactory<ApplicationDbContext>(
            options =>
            {
                options.UseNpgsql(
                    configuration.GetConnectionString("DefaultConnection"),
                    b =>
                    {
                        b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                        b.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                    }
                );
#if DEBUG
                options.EnableSensitiveDataLogging();
#endif
            },
            ServiceLifetime.Scoped
        );

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<IDbContextFactory<ApplicationDbContext>>().CreateDbContext()
        );
        services.AddSingleton<IDateTimeProvider, Infrastructure.Services.DateTimeProvider>();

        // Identity Configuration
        services
            .AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequiredLength = 8;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        // Integrations
        services.AddHttpClient<IElationClient, Infrastructure.Integrations.Elation.ElationClient>(
            client =>
            {
                client.BaseAddress = new Uri(
                    configuration["Integrations:Elation:ApiUrl"]
                        ?? "https://api.elationhealth.com/v1/"
                );
            }
        );

        services.AddHttpClient<
            ICareSourceClient,
            Infrastructure.Integrations.CareSource.CareSourceClient
        >(client =>
        {
            client.BaseAddress = new Uri(
                configuration["Integrations:CareSource:ApiUrl"] ?? "https://api.caresource.com/v1/"
            );
        });

        services.AddHttpClient("OSRM", client =>
        {
            client.BaseAddress = new Uri(
                configuration["Integrations:OSRM:ApiUrl"] ?? "http://router.project-osrm.org/"
            );
            client.Timeout = TimeSpan.FromSeconds(3);
        });

        services.AddScoped<ISchedulingService, Infrastructure.Services.SchedulingService>();
        services.AddScoped<ITravelService, Infrastructure.Services.TravelService>();
        services.AddScoped<IMrnGenerator, Infrastructure.Services.MrnGenerator>();
        services.AddScoped<IStorageService, Infrastructure.Services.LocalFileStorageService>();
        services.AddScoped<IPdfService, Infrastructure.Services.QuestPdfService>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, Infrastructure.Services.CurrentUserService>();
        services.AddScoped<ISecurityAuditService, Infrastructure.Services.SecurityAuditService>();
        services.AddScoped<ISearchService, Infrastructure.Services.SearchService>();
        services.AddScoped<INotificationService, Infrastructure.Services.NotificationService>();
        services.AddScoped<IMagicTokenService, Infrastructure.Services.MagicTokenService>();
        services.AddHostedService<Infrastructure.BackgroundJobs.ProcessOutboxMessagesJob>();

        return services;
    }
}
