using Api;
using Api.GraphQL.Mutations;
using Api.GraphQL.Queries;
using Api.Hubs;
using Application;
using Infrastructure;
using Infrastructure.Data;
using Mapster;
using MapsterMapper;

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
            options.Authority = builder.Configuration["Jwt:Authority"];
            options.TokenValidationParameters =
                new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateAudience = false,
                };
        }
    );

builder.Services.AddAuthorization();

builder
    .Services.AddGraphQLServer()
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
    .AddTypeExtension<LogisticsMutation>()
    .AddProjections()
    .AddFiltering()
    .AddSorting()
    .ModifyPagingOptions(o => o.IncludeTotalCount = true)
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
var wipeDb = builder.Configuration.GetValue<bool>("EMR_WIPE_DB", true);
var seedDb = builder.Configuration.GetValue<bool>("EMR_SEED_DB", true);

await DbInitializer.InitializeAsync(app.Services, wipeDb, seedDb);

app.Run();
