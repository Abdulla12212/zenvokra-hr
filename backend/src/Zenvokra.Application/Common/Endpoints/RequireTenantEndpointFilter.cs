using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Zenvokra.Application.Infrastructure.Tenancy;

namespace Zenvokra.Application.Common.Endpoints;

/// <summary>
/// Rejects a request before it reaches a handler if no tenant could be resolved
/// from the signed session.
/// </summary>
/// <remarks>
/// Applied to the tenant-facing <c>/api</c> group. Login and platform onboarding
/// are mapped onto other groups and skip this filter.
/// </remarks>
public sealed class RequireTenantEndpointFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(next);

        var tenantContext = context.HttpContext.RequestServices.GetRequiredService<ITenantContext>();

        if (!tenantContext.HasTenant)
        {
            return TypedResults.Problem(
                title: "Tenant not resolved",
                detail: "The signed-in account is not attached to a company.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        return await next(context);
    }
}
