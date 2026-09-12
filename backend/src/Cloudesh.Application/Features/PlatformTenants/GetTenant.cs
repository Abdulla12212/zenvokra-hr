using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.PlatformTenants;

public static class GetTenant
{
    public static async Task<Results<Ok<TenantSummary>, NotFound>> HandleAsync(
        Guid tenantId,
        AppDbContext dbContext,
        ITenantScopeFactory tenantScopes,
        CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == tenantId, cancellationToken);

        if (tenant is null)
        {
            return TypedResults.NotFound();
        }

        int adminCount;
        using (tenantScopes.BeginScope(tenantId))
        {
            adminCount = await dbContext.TenantAdmins.AsNoTracking().CountAsync(cancellationToken);
        }

        return TypedResults.Ok(new TenantSummary(
            tenant.Id,
            tenant.Name,
            tenant.Slug,
            tenant.IsActive,
            adminCount,
            tenant.CreatedAtUtc,
            tenant.UpdatedAtUtc));
    }
}
