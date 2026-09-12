using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.PlatformTenants;

public static class UpdateTenantAdmin
{
    public sealed record Request
    {
        [EmailAddress]
        [StringLength(320)]
        public string? Email { get; init; }

        [StringLength(200, MinimumLength = 8)]
        public string? Password { get; init; }
    }

    public static async Task<Results<Ok<TenantAdminSummary>, NotFound, ProblemHttpResult>> HandleAsync(
        Guid tenantId,
        Guid adminId,
        Request request,
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

            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                string email = LoginEmail.Normalize(request.Email);

                if (await PlatformEmailUniqueness.IsTakenAsync(dbContext, email, admin.Id, cancellationToken))
                {
                    return TypedResults.Problem(
                        title: "Email already used",
                        detail: $"An account with the email '{email}' already exists.",
                        statusCode: StatusCodes.Status409Conflict);
                }

                admin.Email = email;
            }

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                admin.Password = request.Password;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new TenantAdminSummary(admin.Id, admin.Email, admin.CreatedAtUtc, admin.UpdatedAtUtc));
        }
    }
}
