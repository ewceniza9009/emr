using Application.Billing.Dtos;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using HotChocolate.Authorization;
using Mapster;
using Microsoft.EntityFrameworkCore;
using Api.GraphQL.Types;
using HotChocolate.Data;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanManageBilling")]
public class BillingQuery
{
    private readonly ICurrentUserService _currentUserService;

    public BillingQuery(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    [UseFiltering(typeof(ZBenefitClaimFilterInputType))]
    [UseSorting]
    public async Task<PagedResponse<ZBenefitClaimDto>> GetZBenefitClaims([Service] IApplicationDbContext context)
    {
        var query = context.ZBenefitClaims
            .Include(x => x.Patient)
            .AsNoTracking();

        var totalCount = await query.CountAsync();
        var items = await query.ProjectToType<ZBenefitClaimDto>().ToListAsync();

        return new PagedResponse<ZBenefitClaimDto>
        {
            Items = items,
            TotalCount = totalCount
        };
    }

    [UseFiltering(typeof(BillingInvoiceFilterInputType))]
    [UseSorting]
    public async Task<PagedResponse<BillingInvoiceDto>> GetBillingInvoices(
        [Service] IApplicationDbContext context,
        Guid? id = null
    )
    {
        var query = context.BillingInvoices.Include(x => x.Patient).AsNoTracking();

        if (id.HasValue)
            query = query.Where(x => x.InvoiceId == id.Value);

        var totalCount = await query.CountAsync();
        var items = await query.ProjectToType<BillingInvoiceDto>().ToListAsync();

        return new PagedResponse<BillingInvoiceDto>
        {
            Items = items,
            TotalCount = totalCount
        };
    }

    public async Task<BillingInvoiceDto?> GetBillingInvoiceById(
        Guid id,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return await context
            .BillingInvoices.Include(x => x.Patient)
            .Include(x => x.Items)
            .AsNoTracking()
            .ProjectToType<BillingInvoiceDto>()
            .FirstOrDefaultAsync(x => x.InvoiceId == id, cancellationToken);
    }
}
