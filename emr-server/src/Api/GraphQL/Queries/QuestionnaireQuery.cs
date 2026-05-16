using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class QuestionnaireQuery
{
    [Authorize(Policy = "CanViewPatients")]
    public async Task<Questionnaire?> GetQuestionnaireById(
        Guid id,
        [Service] ICurrentUserService currentUserService,
        [Service] IApplicationDbContext context,
        CancellationToken ct
    )
    {
        var tenantId = currentUserService.TenantId;
        Console.WriteLine($"[DEBUG] GetQuestionnaireById: id={id}, currentTenant={tenantId}");
        
        var q = await context
            .Questionnaires
            .IgnoreQueryFilters()
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.QuestionnaireId == id, ct);

        if (q == null)
        {
            var allIds = await context.Questionnaires.IgnoreQueryFilters().Select(x => x.QuestionnaireId).ToListAsync(ct);
            Console.WriteLine($"[DEBUG] GetQuestionnaireById FAILED. Available IDs: {string.Join(", ", allIds)}");
        }
        else
        {
            Console.WriteLine($"[DEBUG] GetQuestionnaireById SUCCESS: {q.Name}");
        }

        return q;
    }

    [Authorize(Policy = "CanViewPatients")]
    public async Task<Questionnaire?> GetQuestionnaireByType(
        AssessmentType type,
        [Service] ICurrentUserService currentUserService,
        [Service] IApplicationDbContext context,
        CancellationToken ct
    )
    {
        var tenantId = currentUserService.TenantId;
        Console.WriteLine($"[DEBUG] GetQuestionnaireByType: type={type}, currentTenant={tenantId}");
        
        return await context
            .Questionnaires
            .IgnoreQueryFilters()
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.AssessmentType == type, ct);
    }
}
