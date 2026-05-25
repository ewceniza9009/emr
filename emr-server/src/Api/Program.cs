using System.Threading.RateLimiting;
using Api;
using Application;
using Hangfire;
using Hangfire.Storage.SQLite;
using Infrastructure;
using Infrastructure.Data;
using Infrastructure.Hubs;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
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
                .WriteTo.File("logs/emr-api-.txt", rollingInterval: RollingInterval.Day)
    );

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc(
            "v1",
            new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Title = "Halkyone Clinical API",
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

    builder
        .Services.AddSignalR()
        .AddJsonProtocol(options =>
        {
            options.PayloadSerializerOptions.PropertyNamingPolicy = System
                .Text
                .Json
                .JsonNamingPolicy
                .CamelCase;
        });
    builder.Services.AddHostedService<TelemetrySimulatorService>();

    builder.Services.AddApiServices(builder.Configuration);

    // Background Jobs with Hangfire
    builder.Services.AddHangfire(configuration =>
        configuration
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseSQLiteStorage("Data Source=hangfire.db;")
    );

    builder.Services.AddHangfireServer();

    // Enterprise Observability
    builder
        .Services.AddOpenTelemetry()
        .WithTracing(tracing =>
        {
            tracing
                .AddSource("Halkyone.Clinical.Api")
                .SetResourceBuilder(
                    ResourceBuilder.CreateDefault().AddService("Halkyone.Clinical.Api")
                )
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddEntityFrameworkCoreInstrumentation();

            if (builder.Environment.IsDevelopment())
            {
                // tracing.AddConsoleExporter();
            }
        });

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
    app.UseDefaultFiles();
    app.UseStaticFiles();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseCors("PalliativeCorsPolicy");
    app.UseRouting();

    app.UseHangfireDashboard(
        "/hangfire",
        new DashboardOptions
        {
            Authorization = new[] { new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter() },
        }
    );

    RecurringJob.AddOrUpdate(
        "daily-report",
        () => Console.WriteLine("Generated Daily Clinical Report"),
        Cron.Daily()
    );
    RecurringJob.AddOrUpdate(
        "sms-reminders",
        () => Console.WriteLine("Sent SMS Reminders to patients"),
        Cron.Hourly()
    );

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
    app.MapHub<NotificationHub>("/hubs/notifications");
    app.MapHub<ChatHub>("/hubs/chat");

    using (var scope = app.Services.CreateScope())
    {
        var _logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        try
        {
            _logger.LogInformation("Starting database initialization...");
            await DbInitializer.InitializeAsync(
                scope.ServiceProvider,
                bool.Parse(builder.Configuration["EMR_WIPE_DB"] ?? "false"),
                bool.Parse(builder.Configuration["EMR_SEED_DB"] ?? "true")
            );
            _logger.LogInformation("Database initialization completed successfully.");

            _logger.LogInformation("Warming up database query paths...");
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            _ = await dbContext.Patients.AnyAsync();
            _logger.LogInformation("Database query paths warmed up successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogCritical(
                ex,
                "An error occurred during database initialization. The app will continue starting, but database features may be unavailable."
            );
        }
    }

    app.Run();
}
catch (Exception ex) when (ex.GetType().Name != "HostAbortedException")
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
