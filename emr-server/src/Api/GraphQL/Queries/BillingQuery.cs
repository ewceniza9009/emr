using Application.Billing.Dtos;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using HotChocolate.Authorization;
using Mapster;
using Microsoft.EntityFrameworkCore;
using Api.GraphQL.Types;
using HotChocolate.Data;
using Domain.Enums;

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

    [UseOffsetPaging(DefaultPageSize = 50, IncludeTotalCount = true)]
    [UseFiltering(typeof(ZBenefitClaimFilterInputType))]
    [UseSorting]
    public IQueryable<ZBenefitClaimDto> GetZBenefitClaims([Service] IApplicationDbContext context)
    {
        return context.ZBenefitClaims
            .Include(x => x.Patient)
            .AsNoTracking()
            .ProjectToType<ZBenefitClaimDto>();
    }

    [UseOffsetPaging(DefaultPageSize = 50, IncludeTotalCount = true)]
    [UseFiltering(typeof(BillingInvoiceFilterInputType))]
    [UseSorting]
    public IQueryable<BillingInvoiceDto> GetBillingInvoices(
        [Service] IApplicationDbContext context,
        Guid? id = null
    )
    {
        var query = context.BillingInvoices.Include(x => x.Patient).AsNoTracking();

        if (id.HasValue)
            query = query.Where(x => x.InvoiceId == id.Value);

        return query.ProjectToType<BillingInvoiceDto>();
    }

    public async Task<BillingSummaryDto> GetBillingSummary([Service] IApplicationDbContext context)
    {
        var totalReceivables = await context.BillingInvoices
            .Where(x => x.Status != InvoiceStatus.Cancelled)
            .SumAsync(x => x.PatientResponsibility);

        var pendingClaimsCount = await context.ZBenefitClaims
            .CountAsync(x => x.Status == ClaimStatus.Submitted || x.Status == ClaimStatus.Pending);
        
        var totalClaimsCount = await context.ZBenefitClaims.CountAsync();

        var paidClaimsTotal = await context.ZBenefitClaims
            .Where(x => x.Status == ClaimStatus.Paid)
            .SumAsync(x => x.TotalAmount);

        return new BillingSummaryDto
        {
            TotalReceivables = totalReceivables,
            PendingClaimsCount = pendingClaimsCount,
            TotalClaimsCount = totalClaimsCount,
            PaidClaimsTotal = paidClaimsTotal
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
