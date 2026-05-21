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
            .Include(p => p.Addresses)
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

        // Update Primary Address
        var hasAddressUpdate = request.Street != null || request.City != null ||
                               request.State != null || request.PostalCode != null ||
                               request.Region != null || request.Country != null ||
                               request.Latitude != null || request.Longitude != null;

        if (hasAddressUpdate)
        {
            var primaryAddress = patient.Addresses.FirstOrDefault(a => a.IsPrimary);

            if (primaryAddress == null)
            {
                primaryAddress = new EntityAddress
                {
                    PatientId = patient.PatientId,
                    IsPrimary = true,
                    Type = AddressType.Home,
                };
                patient.Addresses.Add(primaryAddress);
            }

            if (request.Street != null)
                primaryAddress.Address.Street = request.Street;
            if (request.City != null)
                primaryAddress.Address.City = request.City;
            if (request.State != null)
                primaryAddress.Address.State = request.State;
            if (request.PostalCode != null)
                primaryAddress.Address.PostalCode = request.PostalCode;
            if (request.Region != null)
                primaryAddress.Address.Region = request.Region;
            if (request.Country != null)
                primaryAddress.Address.Country = request.Country;
            if (request.Latitude != null)
                primaryAddress.Address.Latitude = request.Latitude;
            if (request.Longitude != null)
                primaryAddress.Address.Longitude = request.Longitude;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
