using Mapster;
using MapsterMapper;
using System.Reflection;
using Api.GraphQL.Queries;
using Api.GraphQL.Mutations;
using Api.Hubs;
using Application;
using Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddMemoryCache();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddMediatR(cfg => 
    cfg.RegisterServicesFromAssembly(typeof(ApplicationAssemblyReference).Assembly));

var typeAdapterConfig = TypeAdapterConfig.GlobalSettings;
typeAdapterConfig.Scan(typeof(ApplicationAssemblyReference).Assembly);
builder.Services.AddSingleton(typeAdapterConfig);
builder.Services.AddScoped<IMapper, ServiceMapper>();

builder.Services.AddSignalR();

builder.Services
    .AddGraphQLServer()
    .AddApolloFederation()
    .AddQueryType<PatientQuery>()
    .AddMutationType<PatientMutation>()
    .AddFiltering()
    .AddSorting();

builder.Services.AddCors(options =>
{
    options.AddPolicy("PalliativeCorsPolicy", builder =>
        builder.WithOrigins("https://carenavigator.emr.local")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials());
});

var app = builder.Build();

app.UseCors("PalliativeCorsPolicy");
app.UseRouting();

app.MapControllers();

app.MapGraphQL("/graphql");

app.MapHub<TelemetryHub>("/hubs/telemetry");

app.Run();
