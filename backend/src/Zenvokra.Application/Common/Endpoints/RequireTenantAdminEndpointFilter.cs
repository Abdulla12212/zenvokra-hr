using Microsoft.AspNetCore.Http;
using Zenvokra.Application.Domain.Identity;

namespace Zenvokra.Application.Common.Endpoints;

/// <summary>
/// Restricts an endpoint to a signed-in tenant admin.
/// </summary>
public sealed class RequireTenantAdminEndpointFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(next);

        var user = context.HttpContext.User;

        if (user.Identity?.IsAuthenticated != true)
        {
            return TypedResults.Problem(
                title: "Unauthorized",
                detail: "Sign in to continue.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        if (!user.IsInRole(UserRoles.TenantAdmin))
        {
            return TypedResults.Problem(
                title: "Forbidden",
                detail: "This action is limited to tenant administrators.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        return await next(context);
    }
}
