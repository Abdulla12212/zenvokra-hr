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

    /// <summary>Route prefix for platform-admin onboarding.</summary>
    public const string PlatformPrefix = "/api/platform";

    /// <summary>
    /// Maps every feature's endpoints onto the group that matches its audience.
    /// </summary>
    public static IEndpointRouteBuilder MapFeatureEndpoints(this IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var anonymous = routes.MapGroup(ApiPrefix);

        var platform = routes.MapGroup(PlatformPrefix)
            .AddEndpointFilter<RequirePlatformAdminEndpointFilter>();

        var tenant = routes.MapGroup(ApiPrefix)
            .AddEndpointFilter<RequireAuthenticationEndpointFilter>()
            .AddEndpointFilter<RequireTenantEndpointFilter>();

        foreach (IEndpointGroup group in DiscoverEndpointGroups())
        {
            IEndpointRouteBuilder target = group.Audience switch
            {
                EndpointAudience.Anonymous => anonymous,
                EndpointAudience.Platform => platform,
                EndpointAudience.Tenant => tenant,
                _ => tenant,
            };

            group.MapEndpoints(target);
        }

        return routes;
    }

    private static IEnumerable<IEndpointGroup> DiscoverEndpointGroups() =>
        Assembly.GetExecutingAssembly()
            .GetExportedTypes()
            .Where(type => type is { IsAbstract: false, IsInterface: false, IsGenericTypeDefinition: false }
                           && typeof(IEndpointGroup).IsAssignableFrom(type))
            .Select(CreateGroup)
            .OrderBy(group => group.GetType().Name, StringComparer.Ordinal);

    private static IEndpointGroup CreateGroup(Type type)
    {
        object instance = Activator.CreateInstance(type)
            ?? throw new InvalidOperationException($"Could not construct endpoint group '{type.Name}'.");

        return (IEndpointGroup)instance;
    }
}
