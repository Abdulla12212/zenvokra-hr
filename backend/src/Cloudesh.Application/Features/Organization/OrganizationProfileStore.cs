using Cloudesh.Application.Domain.Organization;
using Cloudesh.Application.Domain.Tenants;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Organization;

internal static class OrganizationProfileStore
{
    public static async Task<OrganizationProfile?> GetOrCreateAsync(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        OrganizationProfile? profile = await dbContext.OrganizationProfiles
            .SingleOrDefaultAsync(cancellationToken);

        if (profile is not null)
        {
            return profile;
        }

        Guid tenantId = tenantContext.RequireTenantId();
        Tenant? tenant = await dbContext.Tenants
            .AsNoTracking()
            .SingleOrDefaultAsync(row => row.Id == tenantId, cancellationToken);

        if (tenant is null)
        {
            return null;
        }

        profile = OrganizationProfile.CreateDefaults(tenant.Name, tenant.Slug);
        dbContext.OrganizationProfiles.Add(profile);
        return profile;
    }
}
