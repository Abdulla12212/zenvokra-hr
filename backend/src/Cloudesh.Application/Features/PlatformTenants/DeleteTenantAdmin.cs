using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.PlatformTenants;

public static class DeleteTenantAdmin
{
    public static async Task<Results<NoContent, NotFound>> HandleAsync(
        Guid tenantId,
        Guid adminId,
        AppDbContext dbContext,
        ITenantScopeFactory tenantScopes,
        CancellationToken cancellationToken)
    {
        bool tenantExists = await dbContext.Tenants
            .AsNoTracking()
            .AnyAsync(tenant => tenant.Id == tenantId, cancellationToken);

        if (!tenantExists)
        {
            return TypedResults.NotFound();
        }

        using (tenantScopes.BeginScope(tenantId))
        {
            var admin = await dbContext.TenantAdmins
                .SingleOrDefaultAsync(item => item.Id == adminId, cancellationToken);

            if (admin is null)
            {
                return TypedResults.NotFound();
            }

            dbContext.TenantAdmins.Remove(admin);
            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.NoContent();
        }
    }
}
