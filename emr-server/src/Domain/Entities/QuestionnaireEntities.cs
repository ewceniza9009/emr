using System.ComponentModel.DataAnnotations;
using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Questionnaire : BaseEntity, ITenantEntity
{
    [Key]
    public Guid QuestionnaireId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public AssessmentType AssessmentType { get; set; }
    public string? SchemaJson { get; set; } // SurveyJS Schema JSON
    
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}

public class Question : BaseEntity, ITenantEntity
{
    [Key]
    public Guid QuestionId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid QuestionnaireId { get; set; }
    public string Text { get; set; } = null!;
    public string? Subtext { get; set; }
    public QuestionType Type { get; set; }
    public int Order { get; set; }
    public string? OptionsJson { get; set; } // For MultipleChoice

    public Questionnaire Questionnaire { get; set; } = null!;
}

public class AssessmentResponse : BaseEntity, ITenantEntity
{
    [Key]
    public Guid AssessmentResponseId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid QuestionnaireId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public Guid AssessorId { get; set; }
    public DateTimeOffset CompletedAt { get; set; } = DateTimeOffset.UtcNow;
    public string AnswersJson { get; set; } = null!;
    public decimal? TotalScore { get; set; }

    public Questionnaire Questionnaire { get; set; } = null!;
    public Patient Patient { get; set; } = null!;
    public ClinicalEncounter? Encounter { get; set; }
    public Practitioner Assessor { get; set; } = null!;
}
