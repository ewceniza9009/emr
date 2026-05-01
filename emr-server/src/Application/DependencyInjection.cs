using Application.Clinical.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IConflictEngine, ConflictEngine>();
        
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(typeof(ApplicationAssemblyReference).Assembly);
        });

        return services;
    }
}
