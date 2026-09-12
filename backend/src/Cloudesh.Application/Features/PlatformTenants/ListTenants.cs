using Cloudesh.Application.Common.Pagination;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.PlatformTenants;

public static class ListTenants
{
    public static async Task<Ok<PagedResult<TenantSummary>>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken,
        int page = 1,
        int pageSize = PagedResult<TenantSummary>.DefaultPageSize)
    {
        int pageNumber = PagedResult<TenantSummary>.NormalizePage(page);
        int size = PagedResult<TenantSummary>.NormalizePageSize(pageSize);

        var query = dbContext.Tenants.AsNoTracking();

        int totalCount = await query.CountAsync(cancellationToken);

        var tenants = await query
            .OrderBy(tenant => tenant.Name)
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .Select(tenant => new { tenant.Id, tenant.Name, tenant.Slug, tenant.IsActive, tenant.CreatedAtUtc, tenant.UpdatedAtUtc })
            .ToListAsync(cancellationToken);

        // Platform listing spans every company. Naming the filter keeps any future
        // filter (soft-delete) in place.
        var counts = await dbContext.TenantAdmins
            .IgnoreQueryFilters([AppDbContext.TenantIsolationFilter])
            .AsNoTracking()
            .GroupBy(admin => admin.TenantId)
            .Select(group => new { TenantId = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        Dictionary<Guid, int> adminCounts = counts.ToDictionary(item => item.TenantId, item => item.Count);

        var items = tenants
            .Select(tenant => new TenantSummary(
                tenant.Id,
                tenant.Name,
                tenant.Slug,
                tenant.IsActive,
                adminCounts.GetValueOrDefault(tenant.Id),
                tenant.CreatedAtUtc,
                tenant.UpdatedAtUtc))
            .ToList();

        return TypedResults.Ok(new PagedResult<TenantSummary>(items, pageNumber, size, totalCount));
    }
}
