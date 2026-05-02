using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Commands;

public record FinalizeEnrollmentCommand : IRequest<Guid>
{
    public Guid PatientOutreachId { get; init; }
    public string Modality { get; init; } = string.Empty;
    public Guid HealthPlanId { get; init; }
    public string Disposition { get; init; } = string.Empty;
    public string CommunicationStatus { get; init; } = string.Empty;
    public string TechAccess { get; init; } = string.Empty;
    public string? BarriersToCare { get; init; }
}

public class FinalizeEnrollmentCommandHandler : IRequestHandler<FinalizeEnrollmentCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public FinalizeEnrollmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(FinalizeEnrollmentCommand request, CancellationToken cancellationToken)
    {
        var outreach = await _context.PatientOutreaches
            .Include(x => x.OtherContacts)
            .FirstOrDefaultAsync(x => x.PatientOutreachId == request.PatientOutreachId, cancellationToken);

        if (outreach == null) throw new Exception("Outreach lead not found");

        // 1. Generate MRN (Simplified for demo: PN-YYYY-RANDOM)
        var mrn = $"PN-{DateTime.Now.Year}-{new Random().Next(1000, 9999)}";

        // 2. Create Patient Record
        var patient = new Patient
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

            HealthPlanId = request.HealthPlanId,
            CommunicationStatus = Enum.Parse<CommunicationAbility>(request.CommunicationStatus, true),
            TechAccess = Enum.Parse<TechAccessLevel>(request.TechAccess, true),
            BarriersToCare = request.BarriersToCare,
            CreatedAt = DateTime.UtcNow,
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

        _context.Patients.Add(patient);

        // 3. Update Outreach Lead
        outreach.Status = OutreachStatus.Enrolled;
        outreach.EnrolledPatientId = patient.PatientId;
        outreach.SelectedModality = Enum.Parse<CareModality>(request.Modality, true);
        outreach.HealthPlanId = request.HealthPlanId;
        outreach.Disposition = Enum.Parse<EnrollmentDisposition>(request.Disposition, true);
        outreach.CommunicationStatus = Enum.Parse<CommunicationAbility>(request.CommunicationStatus, true);
        outreach.TechAccess = Enum.Parse<TechAccessLevel>(request.TechAccess, true);
        outreach.BarriersToCare = request.BarriersToCare;

        await _context.SaveChangesAsync(cancellationToken);

        return patient.PatientId;
    }
}
