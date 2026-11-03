using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zenvokra.Application.Infrastructure.Persistence;
using Zenvokra.Application.Infrastructure.Tenancy;

namespace Zenvokra.Application.Features.PlatformTenants;

public static class UpdateTenant
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [StringLength(200, MinimumLength = 2)]
        public string Name { get; init; } = string.Empty;

        public bool? IsActive { get; init; }
    }

    public static async Task<Results<Ok<TenantSummary>, NotFound>> HandleAsync(
        Guid tenantId,
        Request request,
        AppDbContext dbContext,
        ITenantScopeFactory tenantScopes,
        CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants
            .SingleOrDefaultAsync(item => item.Id == tenantId, cancellationToken);

        if (tenant is null)
        {
            return TypedResults.NotFound();
        }

        tenant.Name = request.Name.Trim();

        if (request.IsActive is bool isActive)
        {
            tenant.IsActive = isActive;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

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
