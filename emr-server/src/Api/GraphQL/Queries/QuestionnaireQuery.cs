using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType(typeof(Query))]
public class QuestionnaireQuery
{
    [Authorize(Policy = "CanViewPatients")]
    public async Task<Questionnaire?> GetQuestionnaireByType(
        AssessmentType type,
        IApplicationDbContext context,
        CancellationToken ct
    )
    {
        return await context
            .Questionnaires.Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.AssessmentType == type, ct);
    }
}
