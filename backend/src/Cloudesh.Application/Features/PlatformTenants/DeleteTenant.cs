using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.PlatformTenants;

public static class DeleteTenant
{
    public static async Task<Results<NoContent, NotFound>> HandleAsync(
        Guid tenantId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants
            .SingleOrDefaultAsync(item => item.Id == tenantId, cancellationToken);

        if (tenant is null)
        {
            return TypedResults.NotFound();
        }

        dbContext.Tenants.Remove(tenant);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
