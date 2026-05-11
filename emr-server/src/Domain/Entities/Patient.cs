using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Patient : BaseEntity, ITenantEntity
{
    public Guid PatientId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; } // Multi-tenant isolation key
    public string? ExternalId { get; set; } // For Elation/CareSource Mapping
    public string Mrn { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime Dob { get; set; }
    public BiologicalSex BiologicalSex { get; set; } = BiologicalSex.Unknown;
    public string? GenderIdentity { get; set; }
    public string? PhilhealthNumber { get; set; }
    public string? CivilStatus { get; set; }
    public string? Religion { get; set; }
    public string? Occupation { get; set; }
    public string? PlaceOfBirth { get; set; }
    public string? Nationality { get; set; }
    public string? Language { get; set; }
    public string? TriageNote { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public ICollection<EntityAddress> Addresses { get; set; } = new List<EntityAddress>();

    public Guid? HealthPlanId { get; set; }
    public Guid? FacilityId { get; set; }
    public CommunicationAbility? CommunicationStatus { get; set; }
    public TechAccessLevel? TechAccess { get; set; }
    public string? BarriersToCare { get; set; }

    // Enterprise Compliance & Communication
    public bool ConsentToTreat { get; set; }
    public bool ConsentHIPAA { get; set; }
    public bool ConsentMarketing { get; set; }
    public bool InterpreterRequired { get; set; }
    public string? PreferredContactMethod { get; set; }

    // Legal Document Tags
    public bool HasPoa { get; set; }
    public bool HasAdvanceDirective { get; set; }

    public HealthPlan? HealthPlan { get; set; }
    public Facility? Facility { get; set; }
    public ICollection<AdvanceDirective> AdvanceDirectives { get; set; } =
        new List<AdvanceDirective>();
    public ICollection<EsasAssessment> EsasAssessments { get; set; } = new List<EsasAssessment>();

    // Navigation Properties
    public ICollection<PatientPhone> Phones { get; set; } = new List<PatientPhone>();
    public ICollection<PatientEmail> Emails { get; set; } = new List<PatientEmail>();
    public ICollection<PatientContact> Contacts { get; set; } = new List<PatientContact>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<PatientDocument> PatientDocuments { get; set; } =
        new List<PatientDocument>();
    public ICollection<ClinicalEncounter> Encounters { get; set; } = new List<ClinicalEncounter>();
    public ICollection<CareNavigationCase> CareNavigationCases { get; set; } =
        new List<CareNavigationCase>();

    public static Patient CreateFromOutreach(
        PatientOutreach outreach,
        string mrn,
        Guid healthPlanId,
        DateTimeOffset createdAt
    )
    {
        return new Patient
        {
            Mrn = mrn,
            FirstName = outreach.FirstName,
            LastName = outreach.LastName,
            Addresses = new List<EntityAddress>
            {
                new EntityAddress
                {
                    Address = new Address
                    {
                        Street = outreach.MailingAddress.Street,
                        City = outreach.MailingAddress.City,
                        State = outreach.MailingAddress.State,
                        PostalCode = outreach.MailingAddress.PostalCode,
                        Country = outreach.MailingAddress.Country,
                    },
                    Type = AddressType.Home,
                    IsPrimary = true,
                },
            },
            HealthPlanId = healthPlanId,
            CreatedAt = createdAt,
            Phones =
                outreach.PrimaryPhone != null
                    ? new List<PatientPhone>
                    {
                        new PatientPhone
                        {
                            PhoneNumber = outreach.PrimaryPhone,
                            Type = AddressType.Mobile,
                            IsPrimary = true,
                        },
                    }
                    : new List<PatientPhone>(),
            Emails =
                outreach.PrimaryEmail != null
                    ? new List<PatientEmail>
                    {
                        new PatientEmail
                        {
                            EmailAddress = outreach.PrimaryEmail,
                            Type = AddressType.Home,
                            IsPrimary = true,
                        },
                    }
                    : new List<PatientEmail>(),
            Contacts = outreach
                .OtherContacts.Select(c => new PatientContact
                {
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    Relationship = c.Relationship,
                    PhoneNumber = c.PhoneNumber ?? string.Empty,
                    Email = c.Email ?? string.Empty,
                    IsPrimaryContact = c.IsPrimaryContact,
                })
                .ToList(),
        };
    }
}
