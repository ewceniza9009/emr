using Application.Clinical.Services;
using Application.Common.Behaviors;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IConflictEngine, ConflictEngine>();
        
        services.AddValidatorsFromAssembly(typeof(ApplicationAssemblyReference).Assembly);

        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(typeof(ApplicationAssemblyReference).Assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        return services;
    }
}
