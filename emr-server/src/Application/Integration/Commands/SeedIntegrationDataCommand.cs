using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Integration.Commands;

public record SeedIntegrationDataCommand : IRequest<bool>;

public class SeedIntegrationDataCommandHandler : IRequestHandler<SeedIntegrationDataCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public SeedIntegrationDataCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(SeedIntegrationDataCommand request, CancellationToken cancellationToken)
    {
        // 1. Seed CareSource HealthPlan
        if (!await _context.HealthPlans.AnyAsync(x => x.Name == "CareSource", cancellationToken))
        {
            _context.HealthPlans.Add(new HealthPlan
            {
                Name = "CareSource",
                Code = "CS-001",
                Description = "Primary Palliative Care Partner",
                IsActive = true
            });
        }

        // 2. Seed Elation Integration Profile
        if (!await _context.IntegrationProfiles.AnyAsync(x => x.Partner == IntegrationPartner.ElationHealth, cancellationToken))
        {
            _context.IntegrationProfiles.Add(new IntegrationProfile
            {
                Partner = IntegrationPartner.ElationHealth,
                BaseUrl = "https://api.elationhealth.com/v1",
                IsActive = true,
                SettingsJson = "{\"sync_frequency\": \"hourly\", \"map_demographics\": true}"
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
