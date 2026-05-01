namespace Domain.Enums;

public enum DirectiveType
{
    DNR = 1, // Do Not Resuscitate
    DNI = 2, // Do Not Intubate
    FullCode = 3,
    LivingWill = 4,
    HealthcareProxy = 5,
    ComfortMeasuresOnly = 6
}

public enum FacilityType
{
    Hospital = 1,
    NursingHome = 2,
    AssistedLiving = 3,
    HospiceHouse = 4,
    Clinic = 5
}
