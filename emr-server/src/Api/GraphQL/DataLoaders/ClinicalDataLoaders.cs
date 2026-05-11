using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.DataLoaders;

public class PrescriptionsByPatientIdDataLoader : BatchDataLoader<Guid, IEnumerable<Prescription>>
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public PrescriptionsByPatientIdDataLoader(
        IDbContextFactory<ApplicationDbContext> contextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions? options = null)
        : base(batchScheduler, options)
    {
        _contextFactory = contextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, IEnumerable<Prescription>>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var prescriptions = await context.Prescriptions
            .Include(p => p.Medication)
            .Where(p => keys.Contains(p.PatientId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dict = prescriptions.GroupBy(p => p.PatientId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        // Ensure every key has a result (even empty) to prevent GraphQL null errors
        foreach (var key in keys)
        {
            if (!dict.ContainsKey(key))
            {
                dict[key] = Enumerable.Empty<Prescription>();
            }
        }

        return dict;
    }
}

public class DiagnosesByPatientIdDataLoader : BatchDataLoader<Guid, IEnumerable<Diagnosis>>
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public DiagnosesByPatientIdDataLoader(
        IDbContextFactory<ApplicationDbContext> contextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions? options = null)
        : base(batchScheduler, options)
    {
        _contextFactory = contextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, IEnumerable<Diagnosis>>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var diagnoses = await context.Diagnoses
            .Where(d => keys.Contains(d.PatientId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dict = diagnoses.GroupBy(d => d.PatientId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var key in keys)
        {
            if (!dict.ContainsKey(key))
            {
                dict[key] = Enumerable.Empty<Diagnosis>();
            }
        }

        return dict;
    }
}

public class AllergiesByPatientIdDataLoader : BatchDataLoader<Guid, IEnumerable<Allergy>>
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public AllergiesByPatientIdDataLoader(
        IDbContextFactory<ApplicationDbContext> contextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions? options = null)
        : base(batchScheduler, options)
    {
        _contextFactory = contextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, IEnumerable<Allergy>>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var allergies = await context.Allergies
            .Where(a => keys.Contains(a.PatientId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dict = allergies.GroupBy(a => a.PatientId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var key in keys)
        {
            if (!dict.ContainsKey(key))
            {
                dict[key] = Enumerable.Empty<Allergy>();
            }
        }

        return dict;
    }
}

public class DocumentsByPatientIdDataLoader : BatchDataLoader<Guid, IEnumerable<PatientDocument>>
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public DocumentsByPatientIdDataLoader(
        IDbContextFactory<ApplicationDbContext> contextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions? options = null)
        : base(batchScheduler, options)
    {
        _contextFactory = contextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, IEnumerable<PatientDocument>>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var docs = await context.PatientDocuments
            .Where(d => keys.Contains(d.PatientId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dict = docs.GroupBy(d => d.PatientId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var key in keys)
        {
            if (!dict.ContainsKey(key))
            {
                dict[key] = Enumerable.Empty<PatientDocument>();
            }
        }

        return dict;
    }
}

public class ActivitiesByOutreachIdDataLoader : BatchDataLoader<Guid, IEnumerable<OutreachActivity>>
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public ActivitiesByOutreachIdDataLoader(
        IDbContextFactory<ApplicationDbContext> contextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions? options = null)
        : base(batchScheduler, options)
    {
        _contextFactory = contextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, IEnumerable<OutreachActivity>>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var activities = await context.OutreachActivities
            .Where(a => keys.Contains(a.OutreachId))
            .OrderByDescending(a => a.ActivityDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dict = activities.GroupBy(a => a.OutreachId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var key in keys)
        {
            if (!dict.ContainsKey(key))
            {
                dict[key] = Enumerable.Empty<OutreachActivity>();
            }
        }

        return dict;
    }
}

public class ContactsByOutreachIdDataLoader : BatchDataLoader<Guid, IEnumerable<OutreachContact>>
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public ContactsByOutreachIdDataLoader(
        IDbContextFactory<ApplicationDbContext> contextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions? options = null)
        : base(batchScheduler, options)
    {
        _contextFactory = contextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, IEnumerable<OutreachContact>>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var contacts = await context.OutreachContacts
            .Where(c => keys.Contains(c.PatientOutreachId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dict = contacts.GroupBy(c => c.PatientOutreachId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var key in keys)
        {
            if (!dict.ContainsKey(key))
            {
                dict[key] = Enumerable.Empty<OutreachContact>();
            }
        }

        return dict;
    }
}

public class PractitionerByIdDataLoader : BatchDataLoader<Guid, Practitioner>
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public PractitionerByIdDataLoader(
        IDbContextFactory<ApplicationDbContext> contextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions? options = null)
        : base(batchScheduler, options)
    {
        _contextFactory = contextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, Practitioner>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var practitioners = await context.Practitioners
            .Where(p => keys.Contains(p.PractitionerId))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return practitioners.ToDictionary(p => p.PractitionerId);
    }
}

public class ClaimLogsByClaimIdDataLoader : BatchDataLoader<Guid, IEnumerable<ClaimStatusLog>>
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public ClaimLogsByClaimIdDataLoader(
        IDbContextFactory<ApplicationDbContext> contextFactory,
        IBatchScheduler batchScheduler,
        DataLoaderOptions? options = null)
        : base(batchScheduler, options)
    {
        _contextFactory = contextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, IEnumerable<ClaimStatusLog>>> LoadBatchAsync(
        IReadOnlyList<Guid> keys,
        CancellationToken cancellationToken)
    {
        using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        var logs = await context.ClaimStatusLogs
            .Where(l => keys.Contains(l.ClaimId))
            .OrderByDescending(l => l.ChangedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dict = logs.GroupBy(l => l.ClaimId)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        foreach (var key in keys)
        {
            if (!dict.ContainsKey(key))
            {
                dict[key] = Enumerable.Empty<ClaimStatusLog>();
            }
        }

        return dict;
    }
}
