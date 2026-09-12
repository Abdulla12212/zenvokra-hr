using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Common.Endpoints;
using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.PlatformTenants;

public static class CreateTenantAdmin
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [EmailAddress]
        [StringLength(320)]
        public string Email { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(200, MinimumLength = 8)]
        public string Password { get; init; } = string.Empty;
    }

    public static async Task<Results<Created<TenantAdminSummary>, NotFound, ProblemHttpResult>> HandleAsync(
        Guid tenantId,
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

        string email = LoginEmail.Normalize(request.Email);

        if (await PlatformEmailUniqueness.IsTakenAsync(dbContext, email, exceptAdminId: null, cancellationToken))
        {
            return TypedResults.Problem(
                title: "Email already used",
                detail: $"An account with the email '{email}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        using (tenantScopes.BeginScope(tenantId))
        {
            var admin = TenantAdmin.Create(email, request.Password);
            dbContext.TenantAdmins.Add(admin);
            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Created(
                $"{EndpointRegistration.PlatformPrefix}/tenants/{tenantId}/admins/{admin.Id}",
                new TenantAdminSummary(admin.Id, admin.Email, admin.CreatedAtUtc, admin.UpdatedAtUtc));
        }
    }
}
