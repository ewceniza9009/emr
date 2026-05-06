using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using HotChocolate.Types;

namespace Api.GraphQL.Queries;

[ExtendObjectType(typeof(Query))]
public class QuestionnaireQuery
{
    [UseProjection]
    [UseFiltering]
    public IQueryable<Questionnaire> GetQuestionnaires(IApplicationDbContext context)
    {
        return context.Questionnaires;
    }

    public async Task<Questionnaire?> GetQuestionnaireByType(
        AssessmentType type,
        IApplicationDbContext context,
        CancellationToken ct)
    {
        return await context.Questionnaires
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.AssessmentType == type, ct);
    }
}
