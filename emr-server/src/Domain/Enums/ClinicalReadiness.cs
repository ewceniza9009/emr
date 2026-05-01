namespace Domain.Enums;

public enum CommunicationAbility
{
    Verbal = 1,
    NonVerbal = 2,
    Aphasic = 3,
    SpeechImpaired = 4,
    CognitiveImpairment = 5
}

public enum TechAccessLevel
{
    None = 0,
    SmartphoneOnly = 1,
    TabletComputer = 2,
    HighLiteracy = 3,
    NeedsAssistance = 4
}

public enum EnrollmentDisposition
{
    Eager = 1,
    Cooperative = 2,
    Hesitant = 3,
    Resistant = 4,
    Refused = 5
}
