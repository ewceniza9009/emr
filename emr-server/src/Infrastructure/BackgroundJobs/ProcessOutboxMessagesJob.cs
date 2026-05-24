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
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Clean shutdown requested, exit loop
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing outbox messages.");
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }

    private async Task ProcessMessagesAsync(CancellationToken stoppingToken)
    {
        List<OutboxMessage> messages;
        using (var scope = _serviceProvider.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var now = DateTimeOffset.UtcNow;

            messages = await context.OutboxMessages
                .Where(m => m.ProcessedOnUtc == null
                         && m.RetryCount < 5
                         && (m.NextAttemptUtc == null || m.NextAttemptUtc <= now))
                .OrderBy(m => m.CreatedOnUtc)
                .Take(20)
                .ToListAsync(stoppingToken);
        }

        if (messages.Count == 0)
        {
            return;
        }

        // Limit parallelism to prevent DB / search service bottlenecking
        var maxParallelism = 5;
        using var semaphore = new SemaphoreSlim(maxParallelism);

        var tasks = messages.Select(async message =>
        {
            await semaphore.WaitAsync(stoppingToken);
            try
            {
                await ProcessSingleMessageAsync(message.Id, stoppingToken);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
    }

    private async Task ProcessSingleMessageAsync(Guid messageId, CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var searchService = scope.ServiceProvider.GetRequiredService<ISearchService>();

        var message = await context.OutboxMessages.FirstOrDefaultAsync(
            m => m.Id == messageId,
            stoppingToken
        );

        if (message == null || message.ProcessedOnUtc != null)
        {
            return;
        }

        try
        {
            _logger.LogDebug(
                "Processing outbox message {MessageId} of type {MessageType}. Attempt {RetryCount}",
                message.Id,
                message.Type,
                message.RetryCount
            );

            if (message.Type == "IndexPatient")
            {
                var patientId = Guid.Parse(message.Content);
                var patient = await context.Patients
                    .Include(p => p.Addresses)
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
                // For other domain events, publish via MediatR if implemented in the future.
            }

            message.ProcessedOnUtc = DateTimeOffset.UtcNow;
            message.Error = null;
        }
        catch (Exception ex)
        {
            message.RetryCount++;
            message.Error = ex.Message;

            // Exponential backoff: 10s, 20s, 40s, 80s, 160s
            var backoffSeconds = (int)Math.Pow(2, message.RetryCount) * 5;
            message.NextAttemptUtc = DateTimeOffset.UtcNow.AddSeconds(backoffSeconds);

            _logger.LogError(
                ex,
                "Failed to process outbox message {MessageId}. Backing off for {BackoffSeconds} seconds (Attempt {RetryCount}/5)",
                message.Id,
                backoffSeconds,
                message.RetryCount
            );
        }

        await context.SaveChangesAsync(stoppingToken);
    }
}
