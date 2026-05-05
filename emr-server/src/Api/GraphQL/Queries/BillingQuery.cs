using Application.Billing.Dtos;
using Application.Common.Interfaces;
using HotChocolate.Data;
using HotChocolate.Types;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class BillingQuery
{
    public async Task<List<ZBenefitClaimDto>> GetZBenefitClaims(
        Guid? id,
        string? search,
        string? status,
        [Service] IApplicationDbContext context
    )
    {
        var query = context.ZBenefitClaims.AsNoTracking();

        if (id.HasValue)
            query = query.Where(x => x.ClaimId == id.Value);

        if (!string.IsNullOrEmpty(status) && status != "All")
            query = query.Where(x => x.Status.ToString() == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(x =>
                x.PhilhealthNumber.Contains(search)
                || x.Patient.FirstName.Contains(search)
                || x.Patient.LastName.Contains(search)
            );

        return await query
            .OrderByDescending(x => x.SubmittedAt)
            .ProjectToType<ZBenefitClaimDto>()
            .ToListAsync();
    }

    public async Task<List<BillingInvoiceDto>> GetBillingInvoices(
        Guid? id,
        string? search,
        string? status,
        [Service] IApplicationDbContext context
    )
    {
        var query = context.BillingInvoices.AsNoTracking();

        if (id.HasValue)
            query = query.Where(x => x.InvoiceId == id.Value);

        if (!string.IsNullOrEmpty(status) && status != "All")
            query = query.Where(x => x.Status.ToString() == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(x =>
                x.InvoiceNumber.Contains(search)
                || x.Patient.FirstName.Contains(search)
                || x.Patient.LastName.Contains(search)
            );

        return await query
            .OrderByDescending(x => x.GeneratedAt)
            .ProjectToType<BillingInvoiceDto>()
            .ToListAsync();
    }
}
