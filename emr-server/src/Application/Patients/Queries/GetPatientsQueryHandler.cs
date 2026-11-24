using Application.Clinical.Dtos;
using Application.Common.Dtos;
using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Patients.Dtos;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Queries;

public class GetPatientsQueryHandler : IRequestHandler<GetPatientsQuery, PagedResponse<PatientDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPatientsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<PatientDto>> Handle(
        GetPatientsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _context.Patients.AsNoTracking().Where(p => p.IsActive);

        if (!string.IsNullOrEmpty(request.Search))
        {
            var searchTerm = request.Search.Trim().ToLower();
            query = query.Where(p =>
                p.FirstName.ToLower().StartsWith(searchTerm)
                || p.LastName.ToLower().StartsWith(searchTerm)
                || p.Mrn.ToLower().Contains(searchTerm)
                || (
                    searchTerm.Length > 2
                    && (p.FirstName.ToLower().Contains(searchTerm) || p.LastName.ToLower().Contains(searchTerm))
                )
            );
        }

        if (request.DirectiveTypes != null && request.DirectiveTypes.Count > 0)
        {
            var includeNone = request.DirectiveTypes.Any(d =>
                string.Equals(d, "None", StringComparison.OrdinalIgnoreCase)
            );
            var validDirectives = request
                .DirectiveTypes.Select(d =>
                    Enum.TryParse<DirectiveType>(d, true, out var parsed) ? (DirectiveType?)parsed : null
                )
                .Where(d => d.HasValue)
                .Select(d => d!.Value)
                .ToList();

            if (includeNone && validDirectives.Count > 0)
            {
                query = query.Where(p =>
                    !p.AdvanceDirectives.Any(ad => ad.IsActive)
                    || p.AdvanceDirectives.Any(ad => ad.IsActive && validDirectives.Contains(ad.Type))
                );
            }
            else if (includeNone)
            {
                query = query.Where(p => !p.AdvanceDirectives.Any(ad => ad.IsActive));
            }
            else if (validDirectives.Count > 0)
            {
                query = query.Where(p =>
                    p.AdvanceDirectives.Any(ad => ad.IsActive && validDirectives.Contains(ad.Type))
                );
            }
        }

        if (
            !string.IsNullOrEmpty(request.BiologicalSex)
            && Enum.TryParse<BiologicalSex>(request.BiologicalSex, true, out var sex)
        )
        {
            query = query.Where(p => p.BiologicalSex == sex);
        }

        if (request.VisitStatuses != null && request.VisitStatuses.Count > 0)
        {
            var includeNoVisit = request.VisitStatuses.Any(s =>
                string.Equals(s, "No Visit", StringComparison.OrdinalIgnoreCase)
            );
            var validStatuses = request
                .VisitStatuses.Select(s =>
                    Enum.TryParse<AppointmentStatus>(s, true, out var parsed)
                        ? (AppointmentStatus?)parsed
                        : null
                )
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();

            if (includeNoVisit && validStatuses.Count > 0)
            {
                query = query.Where(p =>
                    !p.Appointments.Any(a => a.Status != AppointmentStatus.Cancelled)
                    || validStatuses.Contains(
                        p.Appointments.Where(a => a.Status != AppointmentStatus.Cancelled)
                            .OrderByDescending(a => a.ScheduledStart)
                            .Select(a => a.Status)
                            .FirstOrDefault()
                    )
                );
            }
            else if (includeNoVisit)
            {
                query = query.Where(p =>
                    !p.Appointments.Any(a => a.Status != AppointmentStatus.Cancelled)
                );
            }
            else if (validStatuses.Count > 0)
            {
                query = query.Where(p =>
                    p.Appointments.Any(a => a.Status != AppointmentStatus.Cancelled)
                    && validStatuses.Contains(
                        p.Appointments.Where(a => a.Status != AppointmentStatus.Cancelled)
                            .OrderByDescending(a => a.ScheduledStart)
                            .Select(a => a.Status)
                            .FirstOrDefault()
                    )
                );
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var projected = await query
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .Skip(request.Skip)
            .Take(Math.Clamp(request.Take, 1, 200))
            .Select(p => new
            {
                p.PatientId,
                p.Mrn,
                p.FirstName,
                p.LastName,
                p.Dob,
                p.BiologicalSex,
                p.GenderIdentity,
                p.PhilhealthNumber,
                p.CreatedAt,
                p.HasAdvanceDirective,
                LatestStatus = p
                    .Appointments.Where(a => a.Status != AppointmentStatus.Cancelled)
                    .OrderByDescending(a => a.ScheduledStart)
                    .Select(a => (AppointmentStatus?)a.Status)
                    .FirstOrDefault(),
                Addresses = p
                    .Addresses.Select(a => new EntityAddressDto
                    {
                        Type = a.Type,
                        IsPrimary = a.IsPrimary,
                        Address = new AddressDto
                        {
                            Street = a.Address.Street,
                            City = a.Address.City,
                            State = a.Address.State,
                            PostalCode = a.Address.PostalCode,
                            Region = a.Address.Region,
                            Country = a.Address.Country,
                            Latitude = a.Address.Latitude,
                            Longitude = a.Address.Longitude,
                        },
                    })
                    .ToList(),
                Phones = p
                    .Phones.Select(ph => new PatientPhoneDto
                    {
                        PhoneId = ph.PhoneId,
                        PhoneNumber = ph.PhoneNumber,
                        Type = ph.Type,
                        IsPrimary = ph.IsPrimary,
                    })
                    .ToList(),
                Encounters = p
                    .Encounters.Select(e => new ClinicalEncounterDto
                    {
                        EncounterId = e.EncounterId,
                        PatientId = e.PatientId,
                        PractitionerId = e.PractitionerId,
                        AppointmentId = e.AppointmentId,
                        Type = e.Type,
                        Status = e.Status,
                        EncounterDate = e.EncounterDate,
                    })
                    .ToList(),
            })
            .ToListAsync(cancellationToken);

        var items = projected
            .Select(p => new PatientDto
            {
                PatientId = p.PatientId,
                Mrn = p.Mrn,
                FirstName = p.FirstName,
                LastName = p.LastName,
                Dob = p.Dob,
                BiologicalSex = p.BiologicalSex,
                GenderIdentity = p.GenderIdentity,
                PhilhealthNumber = p.PhilhealthNumber,
                CreatedAt = p.CreatedAt,
                HasAdvanceDirective = p.HasAdvanceDirective,
                VisitStatus = p.LatestStatus.HasValue ? p.LatestStatus.Value.ToString() : "No Visit",
                Addresses = p.Addresses,
                Phones = p.Phones,
                Encounters = p.Encounters,
            })
            .ToList();

        return new PagedResponse<PatientDto> { Items = items, TotalCount = totalCount };
    }
}
