using Cloudesh.Application.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Features.Departments;

/// <summary>
/// WALKING SKELETON: routes for the Departments feature.
/// </summary>
/// <remarks>
/// Discovered automatically at startup — see <see cref="IEndpointGroup"/>. One file
/// per feature owns its routes; nothing central needs editing to add a feature.
/// </remarks>
public sealed class DepartmentEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var departments = routes.MapGroup("/departments")
            .WithTags("Departments");

        departments.MapGet("", ListDepartments.HandleAsync)
            .WithName(nameof(ListDepartments))
            .WithSummary("Lists the current tenant's departments.");

        departments.MapPost("", CreateDepartment.HandleAsync)
            .WithName(nameof(CreateDepartment))
            .WithSummary("Creates a department for the current tenant.");
    }
}
