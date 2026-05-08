using Api;
using Api.GraphQL.Mutations;
using Api.GraphQL.Queries;
using Api.GraphQL.Types;
using Api.Hubs;
using Application;
using Infrastructure;
using Infrastructure.Data;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc(
        "v1",
        new Microsoft.OpenApi.Models.OpenApiInfo { Title = "EMR API", Version = "v1" }
    );
});

builder.Services.AddMemoryCache();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(ApplicationAssemblyReference).Assembly)
);

var typeAdapterConfig = TypeAdapterConfig.GlobalSettings;
typeAdapterConfig.Scan(typeof(ApplicationAssemblyReference).Assembly);
builder.Services.AddSingleton(typeAdapterConfig);
builder.Services.AddScoped<IMapper, ServiceMapper>();

builder.Services.AddSignalR();
builder.Services.AddHostedService<TelemetrySimulatorService>();

// JWT Authentication
builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "Bearer";
        options.DefaultChallengeScheme = "Bearer";
    })
    .AddJwtBearer(
        "Bearer",
        options =>
        {
            options.TokenValidationParameters =
                new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                        System.Text.Encoding.UTF8.GetBytes(
                            builder.Configuration["Jwt:Key"]
                                ?? "SUPER_SECRET_KEY_FOR_DEVELOPMENT_ONLY_123!"
                        )
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
        }
    );

builder.Services.AddAuthorization(options =>
{
    var isAdmin = (AuthorizationHandlerContext context) =>
        context.User.IsInRole("Administrator")
        || context.User.IsInRole("System Admin")
        || context.User.IsInRole("Admin");

    options.AddPolicy(
        "CanViewPatients",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "patients:view")
            )
    );

    options.AddPolicy(
        "CanEditPatients",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "patients:edit")
            )
    );

    options.AddPolicy(
        "CanOrderMeds",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "clinical:order")
            )
    );

    options.AddPolicy(
        "CanManageSetup",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "setup:manage")
            )
    );

    options.AddPolicy(
        "CanManageOutreach",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "outreach:manage")
            )
    );

    options.AddPolicy(
        "CanManageBilling",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "billing:manage")
            )
    );

    options.AddPolicy(
        "CanManageAssets",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "assets:manage")
            )
    );

    options.AddPolicy(
        "CanManageScheduling",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "scheduling:manage")
            )
    );

    options.AddPolicy(
        "CanManageLogistics",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "logistics:manage")
            )
    );

    options.AddPolicy(
        "CanChart",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "clinical:chart")
            )
    );

    options.AddPolicy(
        "CanViewClinical",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "clinical:view")
            )
    );

    options.AddPolicy(
        "CanEditClinical",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "clinical:edit")
            )
    );

    options.AddPolicy(
        "CanManageIdentity",
        policy =>
            policy.RequireAssertion(context =>
                isAdmin(context) || context.User.HasClaim("permission", "identity:manage")
            )
    );
});

builder
    .Services.AddGraphQLServer()
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

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "PalliativeCorsPolicy",
        builder =>
            builder
                .WithOrigins(
                    "https://carenavigator.emr.local",
                    "http://localhost:3431",
                    "http://localhost:3000"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials()
    );
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors("PalliativeCorsPolicy");
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Redirect root to GraphQL IDE
app.MapGet(
    "/",
    context =>
    {
        context.Response.Redirect("/graphql");
        return Task.CompletedTask;
    }
);

app.MapControllers();

app.MapGraphQL("/graphql");

app.MapHub<TelemetryHub>("/hubs/telemetry");

// Seed the database
using (var scope = app.Services.CreateScope())
{
    var wipeDb = builder.Configuration.GetValue<bool?>("EMR_WIPE_DB") ?? true;
    var seedDb = builder.Configuration.GetValue<bool?>("EMR_SEED_DB") ?? true;
    await DbInitializer.InitializeAsync(scope.ServiceProvider, wipeDb, seedDb);
}

app.Run();
