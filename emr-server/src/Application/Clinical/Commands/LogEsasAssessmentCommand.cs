using MediatR;

namespace Application.Clinical.Commands;

public record LogEsasAssessmentCommand(
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
    int Wellbeing
) : IRequest<Guid>;
