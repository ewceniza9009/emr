using Api.GraphQL.Mutations;
using Api.GraphQL.Queries;
using Api.GraphQL.Types;
using HotChocolate.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Microsoft.Extensions.DependencyInjection;

public static class ConfigureServices
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddApiAuthentication(configuration);
        services.AddApiAuthorization();
        services.AddApiGraphQL();
        services.AddApiCors();
        
        return services;
    }

    private static IServiceCollection AddApiAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = "Bearer";
            options.DefaultChallengeScheme = "Bearer";
        })
        .AddJwtBearer("Bearer", options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(configuration["Jwt:Key"] ?? "SUPER_SECRET_KEY_FOR_DEVELOPMENT_ONLY_123!")
                ),
                RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            };
            options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                },
            };
        });

        return services;
    }

    private static IServiceCollection AddApiAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            var isAdmin = (AuthorizationHandlerContext context) =>
                context.User.IsInRole("Administrator")
                || context.User.IsInRole("System Admin")
                || context.User.IsInRole("Admin");

            options.AddPolicy("CanViewPatients", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "patients:view")));
            options.AddPolicy("CanEditPatients", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "patients:edit")));
            options.AddPolicy("CanOrderMeds", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "clinical:order")));
            options.AddPolicy("CanManageSetup", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "setup:manage")));
            options.AddPolicy("CanManageOutreach", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "outreach:manage")));
            options.AddPolicy("CanManageBilling", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "billing:manage")));
            options.AddPolicy("CanManageAssets", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "assets:manage")));
            options.AddPolicy("CanManageScheduling", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "scheduling:manage")));
            options.AddPolicy("CanManageLogistics", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "logistics:manage")));
            options.AddPolicy("CanChart", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "clinical:chart")));
            options.AddPolicy("CanViewClinical", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "clinical:view")));
            options.AddPolicy("CanEditClinical", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "clinical:edit")));
            options.AddPolicy("CanManageIdentity", policy => policy.RequireAssertion(c => isAdmin(c) || c.User.HasClaim("permission", "identity:manage")));
        });

        return services;
    }

    private static IServiceCollection AddApiGraphQL(this IServiceCollection services)
    {
        services.AddGraphQLServer()
            .AddAuthorization()
            .AddApolloFederation()
            .AddQueryType<Query>()
            .AddTypeExtension<PatientQuery>()
            .AddTypeExtension<AppointmentQuery>()
            .AddTypeExtension<ClinicalQuery>()
            .AddTypeExtension<NavigationQuery>()
            .AddTypeExtension<BillingQuery>()
            .AddTypeExtension<DashboardQuery>()
            .AddTypeExtension<OutreachQuery>()
            .AddTypeExtension<QuestionnaireQuery>()
            .AddTypeExtension<SetupQuery>()
            .AddTypeExtension<IdentityQuery>()
            .AddType<BillingInvoiceType>()
            .AddType<ZBenefitClaimType>()
            .AddType<BillingInvoiceFilterInputType>()
            .AddType<ZBenefitClaimFilterInputType>()
            .AddType<EntityAddressInputType>()
            .AddType<PractitionerLicensureInputType>()
            .AddType<PractitionerServiceAreaInputType>()
            .AddType<PractitionerInputType>()
            .AddType<FacilityInputType>()
            .AddType<HealthPlanInputType>()
            .AddType<MedicationInputType>()
            .AddType<SmartPhraseInputType>()
            .AddType<QuestionnaireInputType>()
            .AddType<DurableMedicalEquipmentInputType>()
            .AddType<OutreachScriptInputType>()
            .AddTypeExtension<PatientType>()
            .AddMutationType<Mutation>()
            .AddTypeExtension<PatientMutation>()
            .AddTypeExtension<AppointmentMutation>()
            .AddTypeExtension<ClinicalMutation>()
            .AddTypeExtension<NavigationMutation>()
            .AddTypeExtension<BillingMutation>()
            .AddTypeExtension<IntegrationMutation>()
            .AddTypeExtension<OutreachMutation>()
            .AddTypeExtension<DocumentMutation>()
            .AddTypeExtension<SetupMutation>()
            .AddTypeExtension<IdentityMutation>()
            .AddTypeExtension<LogisticsMutation>()
            .AddProjections()
            .AddFiltering()
            .AddSorting()
            .ModifyPagingOptions(o => o.IncludeTotalCount = true)
            .ModifyCostOptions(o => o.MaxFieldCost = 20000)
            .AddType<UploadType>();

        return services;
    }

    private static IServiceCollection AddApiCors(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("PalliativeCorsPolicy", builder => builder
                .WithOrigins("https://carenavigator.emr.local", "http://localhost:3431", "http://localhost:3000")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials());
        });

        return services;
    }
}
