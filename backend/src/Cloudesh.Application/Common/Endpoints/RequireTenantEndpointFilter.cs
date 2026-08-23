using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Cloudesh.Application.Common.Endpoints;

/// <summary>
/// Rejects a request before it reaches a handler if no tenant could be resolved.
/// </summary>
/// <remarks>
/// Applied once to the whole <c>/api</c> group, so no handler has to check, and a
/// missing tenant produces a clear 400 instead of an empty result set. Endpoints
/// that genuinely have no tenant — signing up, provisioning a new company — must be
/// mapped outside that group.
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
            var options = context.HttpContext.RequestServices
                .GetRequiredService<IOptions<TenancyOptions>>().Value;

            return TypedResults.Problem(
                title: "Tenant not resolved",
                detail: $"Send a valid tenant id in the '{options.HeaderName}' header.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        return await next(context);
    }
}
