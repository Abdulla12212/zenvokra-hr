using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zenvokra.Application.Common.Pagination;
using Zenvokra.Application.Infrastructure.Persistence;
using Zenvokra.Application.Infrastructure.Tenancy;

namespace Zenvokra.Application.Features.PlatformTenants;

public static class ListTenantAdmins
{
    public static async Task<Results<Ok<PagedResult<TenantAdminSummary>>, NotFound>> HandleAsync(
        Guid tenantId,
        AppDbContext dbContext,
        ITenantScopeFactory tenantScopes,
        CancellationToken cancellationToken,
        int page = 1,
        int pageSize = PagedResult<TenantAdminSummary>.DefaultPageSize)
    {
        bool tenantExists = await dbContext.Tenants
            .AsNoTracking()
            .AnyAsync(tenant => tenant.Id == tenantId, cancellationToken);

        if (!tenantExists)
        {
            return TypedResults.NotFound();
        }

        int pageNumber = PagedResult<TenantAdminSummary>.NormalizePage(page);
        int size = PagedResult<TenantAdminSummary>.NormalizePageSize(pageSize);

        using (tenantScopes.BeginScope(tenantId))
        {
            var query = dbContext.TenantAdmins.AsNoTracking();
            int totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(admin => admin.Email)
                .Skip((pageNumber - 1) * size)
                .Take(size)
                .Select(admin => new TenantAdminSummary(admin.Id, admin.Email, admin.CreatedAtUtc, admin.UpdatedAtUtc))
                .ToListAsync(cancellationToken);

            return TypedResults.Ok(new PagedResult<TenantAdminSummary>(items, pageNumber, size, totalCount));
        }
    }
}
