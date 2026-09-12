using Microsoft.AspNetCore.Http;

namespace Cloudesh.Application.Common.Endpoints;

/// <summary>
/// Rejects a request before it reaches a handler if nobody is signed in.
/// </summary>
public sealed class RequireAuthenticationEndpointFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(next);

        if (context.HttpContext.User.Identity?.IsAuthenticated != true)
        {
            return TypedResults.Problem(
                title: "Unauthorized",
                detail: "Sign in to continue.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        return await next(context);
    }
}
