using Cloudesh.Application.Domain.Identity;
using Microsoft.AspNetCore.Http;

namespace Cloudesh.Application.Common.Endpoints;

/// <summary>
/// Restricts an endpoint to a signed-in employee.
/// </summary>
public sealed class RequireEmployeeEndpointFilter : IEndpointFilter
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

        if (!user.IsInRole(UserRoles.Employee))
        {
            return TypedResults.Problem(
                title: "Forbidden",
                detail: "This action is limited to employees.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        return await next(context);
    }
}
