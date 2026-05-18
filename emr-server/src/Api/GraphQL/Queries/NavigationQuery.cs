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
        return await context.CareThreads
            .Include(t => t.Messages)
            .Include(t => t.Patient)
            .Where(t => t.IsActive)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
