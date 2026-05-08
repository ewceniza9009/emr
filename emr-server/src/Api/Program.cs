using Api;
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

builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseStaticFiles(); // Disabled as per instruction to use Azurite exclusively
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

//Seed the database
//using (var scope = app.Services.CreateScope())
//{
//    var wipeDb = builder.Configuration.GetValue<bool?>("EMR_WIPE_DB") ?? true;
//    var seedDb = builder.Configuration.GetValue<bool?>("EMR_SEED_DB") ?? true;
//    await DbInitializer.InitializeAsync(scope.ServiceProvider, wipeDb, seedDb);
//}

app.Run();
