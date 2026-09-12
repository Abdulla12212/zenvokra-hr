using System.Security.Claims;
using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Infrastructure.Auth;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Auth;

public static class GetCurrentUser
{
    public static async Task<Results<Ok<SessionResponse>, ProblemHttpResult>> HandleAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        ClaimsPrincipal user = httpContext.User;

        if (user.Identity?.IsAuthenticated != true)
        {
            return Unauthorized();
        }

        string? userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
        string? email = user.FindFirstValue(ClaimTypes.Email);
        string? role = user.FindFirstValue(ClaimTypes.Role);

        if (!Guid.TryParse(userIdValue, out Guid userId) || email is null || role is null)
        {
            await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized();
        }

        if (role == UserRoles.PlatformAdmin)
        {
            return TypedResults.Ok(new SessionResponse(userId, email, role, TenantId: null, TenantName: null));
        }

        string? tenantClaim = user.FindFirstValue(AuthClaims.TenantId);
        if (!Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized();
        }

        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == tenantId, cancellationToken);

        if (tenant is null || !tenant.IsActive)
        {
            await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized();
        }

        return TypedResults.Ok(new SessionResponse(userId, email, role, tenant.Id, tenant.Name));
    }

    private static ProblemHttpResult Unauthorized() =>
        TypedResults.Problem(
            title: "Unauthorized",
            detail: "Sign in to continue.",
            statusCode: StatusCodes.Status401Unauthorized);
}
