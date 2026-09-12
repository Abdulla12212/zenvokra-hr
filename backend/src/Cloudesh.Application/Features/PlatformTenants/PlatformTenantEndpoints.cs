using Cloudesh.Application.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Features.PlatformTenants;

public sealed class PlatformTenantEndpoints : IEndpointGroup
{
    public EndpointAudience Audience => EndpointAudience.Platform;

    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var tenants = routes.MapGroup("/tenants").WithTags("Platform");

        tenants.MapGet("", ListTenants.HandleAsync)
            .WithName(nameof(ListTenants))
            .WithSummary("Lists every company on the platform.");

        tenants.MapPost("", CreateTenant.HandleAsync)
            .WithName(nameof(CreateTenant))
            .WithSummary("Onboards a new company.");

        tenants.MapGet("/{tenantId:guid}", GetTenant.HandleAsync)
            .WithName(nameof(GetTenant))
            .WithSummary("Returns one company.");

        tenants.MapPut("/{tenantId:guid}", UpdateTenant.HandleAsync)
            .WithName(nameof(UpdateTenant))
            .WithSummary("Renames or activates a company.");

        tenants.MapDelete("/{tenantId:guid}", DeleteTenant.HandleAsync)
            .WithName(nameof(DeleteTenant))
            .WithSummary("Permanently deletes a company and its admins.");

        var admins = tenants.MapGroup("/{tenantId:guid}/admins");

        admins.MapGet("", ListTenantAdmins.HandleAsync)
            .WithName(nameof(ListTenantAdmins))
            .WithSummary("Lists tenant admins for a company.");

        admins.MapPost("", CreateTenantAdmin.HandleAsync)
            .WithName(nameof(CreateTenantAdmin))
            .WithSummary("Adds a tenant admin to a company.");

        admins.MapPut("/{adminId:guid}", UpdateTenantAdmin.HandleAsync)
            .WithName(nameof(UpdateTenantAdmin))
            .WithSummary("Updates a tenant admin's email or password.");

        admins.MapDelete("/{adminId:guid}", DeleteTenantAdmin.HandleAsync)
            .WithName(nameof(DeleteTenantAdmin))
            .WithSummary("Removes a tenant admin.");
    }
}
