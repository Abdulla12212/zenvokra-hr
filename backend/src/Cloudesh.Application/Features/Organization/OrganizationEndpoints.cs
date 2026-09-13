using Cloudesh.Application.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Features.Organization;

public sealed class OrganizationEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var organization = routes.MapGroup("/organization")
            .WithTags("Organization")
            .AddEndpointFilter<RequireTenantAdminEndpointFilter>();

        organization.MapGet("/", GetOrganization.HandleAsync)
            .WithName(nameof(GetOrganization))
            .WithSummary("Returns the current tenant's organization profile.");

        organization.MapPatch("/", UpdateOrganization.HandleAsync)
            .WithName(nameof(UpdateOrganization))
            .WithSummary("Updates contact and workplace fields. Plan fields stay locked.");
    }
}
