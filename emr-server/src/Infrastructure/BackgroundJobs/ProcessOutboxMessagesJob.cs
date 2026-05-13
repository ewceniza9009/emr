using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackgroundJobs;

public class ProcessOutboxMessagesJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ProcessOutboxMessagesJob> _logger;

    public ProcessOutboxMessagesJob(
        IServiceProvider serviceProvider,
        ILogger<ProcessOutboxMessagesJob> logger
    )
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Outbox Processor started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessMessagesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing outbox messages.");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task ProcessMessagesAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var publisher = scope.ServiceProvider.GetRequiredService<IPublisher>();
        var searchService = scope.ServiceProvider.GetRequiredService<ISearchService>();

        var messages = await context
            .OutboxMessages.Where(m => m.ProcessedOnUtc == null)
            .OrderBy(m => m.CreatedOnUtc)
            .Take(20)
            .ToListAsync(stoppingToken);

        foreach (var message in messages)
        {
            try
            {
                _logger.LogDebug(
                    "Processing outbox message {MessageId} of type {MessageType}",
                    message.Id,
                    message.Type
                );

                if (message.Type == "IndexPatient")
                {
                    var patientId = Guid.Parse(message.Content);
                    var patient = await context
                        .Patients.Include(p => p.Addresses)
                        .Where(p => p.PatientId == patientId)
                        .FirstOrDefaultAsync(stoppingToken);

                    if (patient != null)
                    {
                        await searchService.IndexPatientAsync(patient, stoppingToken);
                    }
                }
                else if (message.Type == "IndexOutreach")
                {
                    var outreachId = Guid.Parse(message.Content);
                    var outreach = await context.PatientOutreaches.FirstOrDefaultAsync(
                        o => o.PatientOutreachId == outreachId,
                        stoppingToken
                    );

                    if (outreach != null)
                    {
                        await searchService.IndexOutreachAsync(outreach, stoppingToken);
                    }
                }
                else
                {
                    // For domain events, we would need to deserialize to the actual type
                    // and publish via MediatR. For now, we focus on indexing.
                }

                message.ProcessedOnUtc = DateTimeOffset.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process outbox message {MessageId}", message.Id);
                message.Error = ex.Message;
                // We might want to increment a retry counter or move to a dead-letter queue
            }
        }

        await context.SaveChangesAsync(stoppingToken);
    }
}
