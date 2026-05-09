using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Common.Behaviors;

public class AuditBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AuditBehavior<TRequest, TResponse>> _logger;

    public AuditBehavior(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<AuditBehavior<TRequest, TResponse>> logger
    )
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var requestName = typeof(TRequest).Name;
        var userId = _currentUserService.UserId ?? "System";

        // In high-stakes clinical systems, we audit commands (write operations)
        if (requestName.EndsWith("Command"))
        {
            _logger.LogInformation(
                "Clinical Audit: {RequestName} execution started by {UserId}",
                requestName,
                userId
            );
        }

        var response = await next();

        if (requestName.EndsWith("Command"))
        {
            try
            {
                var log = new SecurityAuditLog
                {
                    SecurityAuditLogId = Guid.NewGuid(),
                    Action = $"EXECUTE_{requestName.ToUpper()}",
                    ActorUserId = userId,
                    Details = System.Text.Json.JsonSerializer.Serialize(request),
                    TenantId = _currentUserService.TenantId ?? Guid.Empty,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId,
                };

                _context.SecurityAuditLogs.Add(log);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Clinical Audit: {RequestName} successfully persisted for {UserId}",
                    requestName,
                    userId
                );
            }
            catch (Exception ex)
            {
                // We don't want to fail the actual command if auditing fails, but we MUST log the failure
                _logger.LogCritical(
                    ex,
                    "CRITICAL: Failed to persist clinical audit log for {RequestName}. This may be a compliance risk.",
                    requestName
                );
            }
        }

        return response;
    }
}
