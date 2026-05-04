using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class MrnGenerator : IMrnGenerator
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTimeProvider;

    public MrnGenerator(IApplicationDbContext context, IDateTimeProvider dateTimeProvider)
    {
        _context = context;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<string> GenerateMrnAsync(CancellationToken cancellationToken = default)
    {
        var year = _dateTimeProvider.UtcNow.Year;

        // Fetch the next value from the atomic database sequence.
        // This prevents race conditions and ensures MRN uniqueness in high-concurrency environments.
        var connection = _context.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT nextval('patient_mrn_seq')";

        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        var sequenceValue = Convert.ToInt64(result);

        return $"PN-{year}-{sequenceValue:D5}";
    }
}
