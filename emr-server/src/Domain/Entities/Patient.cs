using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Patient : BaseEntity
{
    public Guid PatientId { get; set; } = Guid.NewGuid();
    public string? ExternalId { get; set; } // For Elation/CareSource Mapping
    public string Mrn { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime Dob { get; set; }
    public string BiologicalSex { get; set; } = string.Empty;
    public string? GenderIdentity { get; set; }
    public string? PhilhealthNumber { get; set; }
    // Navigation Properties
    public ICollection<EntityAddress> Addresses { get; set; } = new List<EntityAddress>();



    public Guid? HealthPlanId { get; set; }
    public Guid? FacilityId { get; set; }
    public CommunicationAbility? CommunicationStatus { get; set; }
    public TechAccessLevel? TechAccess { get; set; }
    public string? BarriersToCare { get; set; }

    public HealthPlan? HealthPlan { get; set; }
    public Facility? Facility { get; set; }
    public ICollection<AdvanceDirective> AdvanceDirectives { get; set; } = new List<AdvanceDirective>();
    public ICollection<EsasAssessment> EsasAssessments { get; set; } = new List<EsasAssessment>();

    // Navigation Properties
    public ICollection<PatientPhone> Phones { get; set; } = new List<PatientPhone>();
    public ICollection<PatientEmail> Emails { get; set; } = new List<PatientEmail>();
    public ICollection<PatientContact> Contacts { get; set; } = new List<PatientContact>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public static Patient CreateFromOutreach(PatientOutreach outreach, string mrn, Guid healthPlanId, DateTimeOffset createdAt)
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
                        Country = outreach.MailingAddress.Country
                    },
                    Type = AddressType.Home,
                    IsPrimary = true
                }
            },
            HealthPlanId = healthPlanId,
            CreatedAt = createdAt,
            Phones = outreach.PrimaryPhone != null ? new List<PatientPhone> 
            { 
                new PatientPhone { PhoneNumber = outreach.PrimaryPhone, Type = AddressType.Mobile, IsPrimary = true } 
            } : new List<PatientPhone>(),
            Emails = outreach.PrimaryEmail != null ? new List<PatientEmail> 
            { 
                new PatientEmail { EmailAddress = outreach.PrimaryEmail, Type = AddressType.Home, IsPrimary = true } 
            } : new List<PatientEmail>(),
            Contacts = outreach.OtherContacts.Select(c => new PatientContact
            {
                FirstName = c.FirstName,
                LastName = c.LastName,
                Relationship = c.Relationship,
                PhoneNumber = c.PhoneNumber ?? string.Empty,
                Email = c.Email ?? string.Empty,
                IsPrimaryContact = c.IsPrimaryContact
            }).ToList()
        };
    }
}
