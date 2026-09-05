using Cloudesh.Application.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Features.Employees;

public sealed class EmployeeEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var employees = routes.MapGroup("/employees").WithTags("Employees");

        employees.MapGet("/me", GetCurrentEmployee.HandleAsync)
            .WithName(nameof(GetCurrentEmployee))
            .WithSummary("Returns the current tenant's one employee.");
    }
}
