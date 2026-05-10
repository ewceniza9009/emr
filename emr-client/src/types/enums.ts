export enum BiologicalSex {
  MALE = "MALE",
  FEMALE = "FEMALE",
  INTERSEX = "INTERSEX",
  OTHER = "OTHER",
  UNKNOWN = "UNKNOWN",
}

export enum CareModality {
  HomeCare = "HomeCare",
  InPatientHospice = "InPatientHospice",
  OutpatientClinic = "OutpatientClinic",
  VirtualCare = "VirtualCare",
  HybridCare = "HybridCare",
}

export enum EnrollmentDisposition {
  Eager = "Eager",
  Cooperative = "Cooperative",
  Hesitant = "Hesitant",
  Resistant = "Resistant",
  Refused = "Refused",
}

export enum CommunicationAbility {
  Verbal = "Verbal",
  NonVerbal = "NonVerbal",
  Aphasic = "Aphasic",
  SpeechImpaired = "SpeechImpaired",
  CognitiveImpairment = "CognitiveImpairment",
}

export enum TechAccessLevel {
  None = "None",
  SmartphoneOnly = "SmartphoneOnly",
  TabletComputer = "TabletComputer",
  HighLiteracy = "HighLiteracy",
  NeedsAssistance = "NeedsAssistance",
}
