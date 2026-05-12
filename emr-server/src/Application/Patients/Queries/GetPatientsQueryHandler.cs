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
        var query = _context.Patients.AsNoTracking();

        if (!string.IsNullOrEmpty(request.Search))
        {
            var searchTerm = request.Search.Trim().ToLower();
            query = query.Where(p =>
                p.FirstName.ToLower().StartsWith(searchTerm)
                || p.LastName.ToLower().StartsWith(searchTerm)
                || p.Mrn.ToLower().Contains(searchTerm)
                || (
                    searchTerm.Length > 2
                    && (
                        p.FirstName.ToLower().Contains(searchTerm)
                        || p.LastName.ToLower().Contains(searchTerm)
                    )
                )
            );
        }

        if (request.DirectiveTypes != null && request.DirectiveTypes.Any())
        {
            if (request.DirectiveTypes.Contains("None"))
            {
                query = query.Where(p =>
                    !p.AdvanceDirectives.Any(ad => ad.IsActive)
                    || p.AdvanceDirectives.Any(ad =>
                        ad.IsActive && request.DirectiveTypes.Contains(ad.Type.ToString())
                    )
                );
            }
            else
            {
                query = query.Where(p =>
                    p.AdvanceDirectives.Any(ad =>
                        ad.IsActive && request.DirectiveTypes.Contains(ad.Type.ToString())
                    )
                );
            }
        }

        if (!string.IsNullOrEmpty(request.BiologicalSex))
        {
            query = query.Where(p => p.BiologicalSex.ToString() == request.BiologicalSex);
        }

        if (request.VisitStatuses != null && request.VisitStatuses.Any())
        {
            query = query.Where(p =>
                request.VisitStatuses.Contains(
                    p.Appointments.Where(a => a.Status != AppointmentStatus.Cancelled)
                        .OrderByDescending(a => a.ScheduledStart)
                        .Select(a => a.Status.ToString())
                        .FirstOrDefault()
                        ?? "No Visit"
                )
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(p => new PatientDto
            {
                PatientId = p.PatientId,
                Mrn = p.Mrn,
                FirstName = p.FirstName,
                LastName = p.LastName,
                Dob = p.Dob,
                CreatedAt = p.CreatedAt,
                VisitStatus =
                    p.Appointments.Where(a => a.Status != AppointmentStatus.Cancelled)
                        .OrderByDescending(a => a.ScheduledStart)
                        .Select(a => a.Status.ToString())
                        .FirstOrDefault()
                    ?? "No Visit",
                Addresses = p
                    .Addresses.Select(a => new Application.Common.Dtos.EntityAddressDto
                    {
                        Type = a.Type,
                        IsPrimary = a.IsPrimary,
                        Address = new Application.Common.Dtos.AddressDto
                        {
                            Street = a.Address.Street,
                            City = a.Address.City,
                            State = a.Address.State,
                            PostalCode = a.Address.PostalCode,
                        },
                    })
                    .ToList(),
                Phones = p
                    .Phones.Select(ph => new PatientPhoneDto
                    {
                        PhoneNumber = ph.PhoneNumber,
                        Type = ph.Type,
                        IsPrimary = ph.IsPrimary,
                    })
                    .ToList(),
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<PatientDto> { Items = items, TotalCount = totalCount };
    }
}
