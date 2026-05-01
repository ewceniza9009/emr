using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Patient> Patients { get; }
    DbSet<Practitioner> Practitioners { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
