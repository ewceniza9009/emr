using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Commands;

public class UpdatePatientCommandHandler : IRequestHandler<UpdatePatientCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdatePatientCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(
        UpdatePatientCommand request,
        CancellationToken cancellationToken
    )
    {
        var patient = await _context
            .Patients.Include(p => p.Phones)
            .Include(p => p.Emails)
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId, cancellationToken);

        if (patient == null)
            return false;

        // Update Demographics
        if (request.CivilStatus != null)
            patient.CivilStatus = request.CivilStatus;
        if (request.Religion != null)
            patient.Religion = request.Religion;
        if (request.Occupation != null)
            patient.Occupation = request.Occupation;
        if (request.Language != null)
            patient.Language = request.Language;
        if (request.Nationality != null)
            patient.Nationality = request.Nationality;
        if (request.BiologicalSex != null)
            patient.BiologicalSex = Enum.Parse<BiologicalSex>(request.BiologicalSex, true);
        if (request.GenderIdentity != null)
            patient.GenderIdentity = request.GenderIdentity;

        // Sync Phones Collection
        if (request.Phones != null)
        {
            patient.Phones.Clear();
            foreach (var p in request.Phones)
            {
                patient.Phones.Add(
                    new PatientPhone
                    {
                        PatientId = patient.PatientId,
                        PhoneNumber = p.PhoneNumber,
                        Type = Enum.Parse<AddressType>(p.Type, true),
                        IsPrimary = p.IsPrimary,
                    }
                );
            }
        }
        else if (request.PrimaryPhone != null)
        {
            var primaryPhone = patient.Phones.FirstOrDefault(p => p.IsPrimary);
            if (primaryPhone != null)
                primaryPhone.PhoneNumber = request.PrimaryPhone;
            else
                patient.Phones.Add(
                    new PatientPhone
                    {
                        PatientId = patient.PatientId,
                        PhoneNumber = request.PrimaryPhone,
                        Type = AddressType.Mobile,
                        IsPrimary = true,
                    }
                );
        }

        // Sync Emails Collection
        if (request.Emails != null)
        {
            patient.Emails.Clear();
            foreach (var e in request.Emails)
            {
                patient.Emails.Add(
                    new PatientEmail
                    {
                        PatientId = patient.PatientId,
                        EmailAddress = e.EmailAddress,
                        Type = Enum.Parse<AddressType>(e.Type, true),
                        IsPrimary = e.IsPrimary,
                    }
                );
            }
        }
        else if (request.PrimaryEmail != null)
        {
            var primaryEmail = patient.Emails.FirstOrDefault(e => e.IsPrimary);
            if (primaryEmail != null)
                primaryEmail.EmailAddress = request.PrimaryEmail;
            else
                patient.Emails.Add(
                    new PatientEmail
                    {
                        PatientId = patient.PatientId,
                        EmailAddress = request.PrimaryEmail,
                        Type = AddressType.Home,
                        IsPrimary = true,
                    }
                );
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
