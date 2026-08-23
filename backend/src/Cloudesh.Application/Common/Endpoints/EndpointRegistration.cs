using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Common.Endpoints;

/// <summary>
/// Discovers and invokes every <see cref="IEndpointGroup"/> in the application
/// assembly.
/// </summary>
public static class EndpointRegistration
{
    /// <summary>Route prefix shared by every feature endpoint.</summary>
    public const string ApiPrefix = "/api";

    /// <summary>
    /// Maps every feature's endpoints under <see cref="ApiPrefix"/>, behind the
    /// tenant guard.
    /// </summary>
    public static IEndpointRouteBuilder MapFeatureEndpoints(this IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var api = routes.MapGroup(ApiPrefix)
            .AddEndpointFilter<RequireTenantEndpointFilter>();

        foreach (IEndpointGroup group in DiscoverEndpointGroups())
        {
            group.MapEndpoints(api);
        }

        return routes;
    }

    private static IEnumerable<IEndpointGroup> DiscoverEndpointGroups() =>
        Assembly.GetExecutingAssembly()
            .GetExportedTypes()
            .Where(type => type is { IsAbstract: false, IsInterface: false, IsGenericTypeDefinition: false }
                           && typeof(IEndpointGroup).IsAssignableFrom(type))
            .Select(type => (IEndpointGroup)Activator.CreateInstance(type)!)
            .OrderBy(group => group.GetType().Name, StringComparer.Ordinal);
}
