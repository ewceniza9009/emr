namespace Application.Clinical.Dtos;

public record EsasAssessmentDto(
    Guid AssessmentId,
    Guid PatientId,
    Guid? EncounterId,
    int Pain,
    int Tiredness,
    int Drowsiness,
    int Nausea,
    int LackOfAppetite,
    int ShortnessOfBreath,
    int Depression,
    int Anxiety,
    int Wellbeing,
    DateTimeOffset AssessedAt
);
