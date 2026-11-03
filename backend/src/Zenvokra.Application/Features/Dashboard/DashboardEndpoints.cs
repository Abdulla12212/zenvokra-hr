using Zenvokra.Application.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Zenvokra.Application.Features.Dashboard;

public sealed class DashboardEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var dashboard = routes.MapGroup("/dashboard")
            .WithTags("Dashboard")
            .AddEndpointFilter<RequireTenantAdminEndpointFilter>();

        dashboard.MapGet("/", GetDashboard.HandleAsync)
            .WithName(nameof(GetDashboard))
            .WithSummary("Returns admin dashboard totals for the current tenant.");
    }
}
