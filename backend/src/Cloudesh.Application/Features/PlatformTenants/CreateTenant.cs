using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Common.Endpoints;
using Cloudesh.Application.Domain.Tenants;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.PlatformTenants;

public static class CreateTenant
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [StringLength(200, MinimumLength = 2)]
        public string Name { get; init; } = string.Empty;
    }

    public static async Task<Created<TenantSummary>> HandleAsync(
        Request request,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        string name = request.Name.Trim();
        string slug = await AllocateSlugAsync(dbContext, TenantSlug.FromName(name), cancellationToken);

        var tenant = Tenant.Create(name, slug);
        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created(
            $"{EndpointRegistration.PlatformPrefix}/tenants/{tenant.Id}",
            new TenantSummary(
                tenant.Id,
                tenant.Name,
                tenant.Slug,
                tenant.IsActive,
                AdminCount: 0,
                tenant.CreatedAtUtc,
                tenant.UpdatedAtUtc));
    }

    internal static async Task<string> AllocateSlugAsync(
        AppDbContext dbContext,
        string baseSlug,
        CancellationToken cancellationToken)
    {
        string slug = baseSlug;
        int suffix = 2;

        while (await dbContext.Tenants.AnyAsync(tenant => tenant.Slug == slug, cancellationToken))
        {
            slug = TenantSlug.WithSuffix(baseSlug, suffix);
            suffix++;
        }

        return slug;
    }
}
