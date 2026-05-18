using Application.Navigation.Commands;
using Application.Common.Interfaces;
using Domain.Entities;
using HotChocolate.Authorization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class NavigationMutation
{
    [Authorize(Policy = "CanViewPatients")]
    public async Task<Guid> CreateCareNavigationCase(
        CreateCareNavigationCaseCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    [Authorize(Policy = "CanViewPatients")]
    public async Task<bool> ReassignCareNavigator(
        Guid patientId,
        Guid newNavigatorId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var activeCase = await context.CareNavigationCases
            .FirstOrDefaultAsync(c => c.PatientId == patientId && c.Status == Domain.Enums.CaseStatus.Open, cancellationToken);

        if (activeCase != null)
        {
            activeCase.NavigatorId = newNavigatorId;
            await context.SaveChangesAsync(cancellationToken);
            return true;
        }

        var newCase = new CareNavigationCase
        {
            CaseId = Guid.NewGuid(),
            PatientId = patientId,
            NavigatorId = newNavigatorId,
            Status = Domain.Enums.CaseStatus.Open,
            OpenedAt = DateTimeOffset.UtcNow
        };
        context.CareNavigationCases.Add(newCase);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
