using Api.GraphQL.Types;
using Application.Billing.Dtos;
using Application.Common.Interfaces;
using Domain.Enums;
using HotChocolate.Authorization;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class BillingQuery
{
    private readonly ICurrentUserService _currentUserService;

    public BillingQuery(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    [Authorize(Policy = "CanManageBilling")]
    [UseOffsetPaging(DefaultPageSize = 50, IncludeTotalCount = true)]
    [UseFiltering(typeof(ZBenefitClaimFilterInputType))]
    [UseSorting]
    public IQueryable<ZBenefitClaimDto> GetZBenefitClaims([Service] IApplicationDbContext context)
    {
        return context.ZBenefitClaims.AsNoTracking().OrderByDescending(x => x.CreatedAt).ProjectToType<ZBenefitClaimDto>();
    }

    [Authorize(Policy = "CanManageBilling")]
    [UseOffsetPaging(DefaultPageSize = 50, IncludeTotalCount = true)]
    [UseFiltering(typeof(BillingInvoiceFilterInputType))]
    [UseSorting]
    public IQueryable<BillingInvoiceDto> GetBillingInvoices(
        [Service] IApplicationDbContext context,
        Guid? id = null
    )
    {
        var query = context.BillingInvoices.AsNoTracking();

        if (id.HasValue)
            query = query.Where(x => x.InvoiceId == id.Value);

        return query.OrderByDescending(x => x.CreatedAt).ProjectToType<BillingInvoiceDto>();
    }

    [Authorize(Policy = "CanManageBilling")]
    public async Task<BillingSummaryDto> GetBillingSummary([Service] IApplicationDbContext context)
    {
        // Consolidated into a single database round-trip using subqueries
        return await context
                .BillingInvoices.OrderBy(x => x.InvoiceId)
                .Select(_ => new BillingSummaryDto
                {
                    TotalReceivables = context
                        .BillingInvoices.Where(x => x.Status != InvoiceStatus.Cancelled)
                        .Sum(x => x.PatientResponsibility),

                    PendingClaimsCount = context.ZBenefitClaims.Count(x =>
                        x.Status == ClaimStatus.Submitted || x.Status == ClaimStatus.Pending
                    ),

                    TotalClaimsCount = context.ZBenefitClaims.Count(),

                    PaidClaimsTotal = context
                        .ZBenefitClaims.Where(x => x.Status == ClaimStatus.Paid)
                        .Sum(x => x.TotalAmount),
                })
                .FirstOrDefaultAsync()
            ?? new BillingSummaryDto();
    }

    [Authorize(Policy = "CanManageBilling")]
    public async Task<BillingInvoiceDto?> GetBillingInvoiceById(
        Guid id,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return await context
            .BillingInvoices.AsNoTracking()
            .ProjectToType<BillingInvoiceDto>()
            .FirstOrDefaultAsync(x => x.InvoiceId == id, cancellationToken);
    }
}
