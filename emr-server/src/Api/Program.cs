using System.Threading.RateLimiting;
using Api;
using Api.Hubs;
using Application;
using Infrastructure;
using Infrastructure.Data;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.RateLimiting;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/emr-api-.txt", rollingInterval: RollingInterval.Day)
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog(
        (context, services, configuration) =>
            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .WriteTo.Console()
    );

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc(
            "v1",
            new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Title = "Halcyon Clinical API",
                Version = "v1",
                Description = "Enterprise-grade Clinical Operating System for Palliative Care.",
            }
        );

        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = System.IO.Path.Combine(AppContext.BaseDirectory, xmlFile);
        c.IncludeXmlComments(xmlPath);
    });

    builder.Services.AddMemoryCache();

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    var typeAdapterConfig = TypeAdapterConfig.GlobalSettings;
    typeAdapterConfig.Scan(typeof(ApplicationAssemblyReference).Assembly);
    builder.Services.AddSingleton(typeAdapterConfig);
    builder.Services.AddScoped<IMapper, ServiceMapper>();

    builder.Services.AddSignalR();
    builder.Services.AddHostedService<TelemetrySimulatorService>();

    builder.Services.AddApiServices(builder.Configuration);

    // Enterprise Observability
    builder
        .Services.AddOpenTelemetry()
        .WithTracing(tracing =>
            tracing
                .AddSource("Halcyon.Clinical.Api")
                .SetResourceBuilder(
                    ResourceBuilder.CreateDefault().AddService("Halcyon.Clinical.Api")
                )
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddEntityFrameworkCoreInstrumentation()
                .AddConsoleExporter()
        );

    // Resilience & Health Checks
    builder.Services.AddHealthChecks().AddDbContextCheck<ApplicationDbContext>("Database");

    // API Versioning
    builder
        .Services.AddApiVersioning(options =>
        {
            options.DefaultApiVersion = new Asp.Versioning.ApiVersion(1, 0);
            options.AssumeDefaultVersionWhenUnspecified = true;
            options.ReportApiVersions = true;
        })
        .AddApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });

    // Security - Rate Limiting
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.AddFixedWindowLimiter(
            "fixed",
            opt =>
            {
                opt.PermitLimit = 100;
                opt.Window = TimeSpan.FromMinutes(1);
                opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 2;
            }
        );
    });

    var app = builder.Build();

    app.UseMiddleware<Api.Middleware.ExceptionMiddleware>();
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseCors("PalliativeCorsPolicy");
    app.UseRouting();

    app.UseAuthentication();
    app.UseAuthorization();
    app.UseRateLimiter();

    app.MapHealthChecks("/health");

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

    //using (var scope = app.Services.CreateScope())
    //{
    //    var wipeDb = builder.Configuration.GetValue<bool?>("EMR_WIPE_DB") ?? true;
    //    var seedDb = builder.Configuration.GetValue<bool?>("EMR_SEED_DB") ?? true;
    //    await DbInitializer.InitializeAsync(scope.ServiceProvider, wipeDb, seedDb);
    //}

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
