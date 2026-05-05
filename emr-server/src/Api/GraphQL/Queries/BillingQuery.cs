using Application.Billing.Dtos;
using Application.Common.Interfaces;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class BillingQuery
{
    public async Task<List<ZBenefitClaimDto>> GetZBenefitClaims(
        Guid? id,
        [Service] IApplicationDbContext context)
    {
        var query = context.ZBenefitClaims.AsNoTracking();
        if (id.HasValue) query = query.Where(x => x.ClaimId == id.Value);
        return await query.ProjectToType<ZBenefitClaimDto>().ToListAsync();
    }

    public async Task<List<BillingInvoiceDto>> GetBillingInvoices(
        Guid? id,
        [Service] IApplicationDbContext context)
    {
        var query = context.BillingInvoices.AsNoTracking();
        if (id.HasValue) query = query.Where(x => x.InvoiceId == id.Value);
        return await query.ProjectToType<BillingInvoiceDto>().ToListAsync();
    }
}
