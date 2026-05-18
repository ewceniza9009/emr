using Application.Common.Interfaces;
using Application.Navigation.Dtos;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Authorization;
using HotChocolate.Data;
using HotChocolate.Types;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class NavigationQuery
{
    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    public IQueryable<CareNavigationCaseDto> GetCareNavigationCases(
        [Service] IApplicationDbContext context
    )
    {
        return context.CareNavigationCases.AsNoTracking().ProjectToType<CareNavigationCaseDto>();
    }

    [Authorize(Policy = "CanViewPatients")]
    public async Task<IEnumerable<CareThread>> GetPatientChatThreads(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var threads = await context.CareThreads
            .Include(t => t.Messages)
            .Where(t => t.PatientId == patientId && t.IsActive)
            .ToListAsync(cancellationToken);

        if (!threads.Any())
        {
            var patient = await context.Patients
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);
                
            if (patient != null)
            {
                var newThread = new CareThread
                {
                    CareThreadId = Guid.NewGuid(),
                    TenantId = patient.TenantId,
                    PatientId = patientId,
                    Subject = "Mobile Chat",
                    IsActive = true
                };
                context.CareThreads.Add(newThread);
                await context.SaveChangesAsync(cancellationToken);
                
                newThread.Messages = new List<ChatMessage>();
                threads.Add(newThread);
            }
        }

        return threads;
    }

    [Authorize(Policy = "CanViewPatients")]
    public async Task<IEnumerable<CareThread>> GetMyInboxThreads(
        [Service] IApplicationDbContext context,
        [Service] ICurrentUserService currentUserService,
        CancellationToken cancellationToken
    )
    {
        var currentTenantId = currentUserService.TenantId ?? Guid.Empty;
        Console.WriteLine($"[INBOX_DEBUG] CurrentTenantId: {currentTenantId}");

        var allThreads = await context.CareThreads
            .IgnoreQueryFilters()
            .Include(t => t.Messages)
            .Include(t => t.Patient)
            .ToListAsync(cancellationToken);

        Console.WriteLine($"[INBOX_DEBUG] Found {allThreads.Count} total threads in DB (ignoring filters)");
        foreach (var t in allThreads)
        {
            Console.WriteLine($"[INBOX_DEBUG] ThreadId: {t.CareThreadId}, TenantId: {t.TenantId}, IsActive: {t.IsActive}, PatientId: {t.PatientId}, PatientName: {(t.Patient != null ? t.Patient.FirstName + " " + t.Patient.LastName : "Null")}");
        }

        return await context.CareThreads
            .Include(t => t.Messages)
            .Include(t => t.Patient)
            .Where(t => t.IsActive)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
