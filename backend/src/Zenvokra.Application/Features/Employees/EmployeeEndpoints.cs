using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Zenvokra.Application.Common.Endpoints;

namespace Zenvokra.Application.Features.Employees;

public sealed class EmployeeEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var employees = routes.MapGroup("/employees").WithTags("Employees");

        employees.MapGet("/me", GetCurrentEmployee.HandleAsync)
            .AddEndpointFilter<RequireEmployeeEndpointFilter>()
            .WithName(nameof(GetCurrentEmployee))
            .WithSummary("Returns the signed-in employee's record.");

        employees.MapGet("/", ListEmployees.HandleAsync)
            .AddEndpointFilter<RequireTenantAdminEndpointFilter>()
            .WithName(nameof(ListEmployees))
            .WithSummary("Lists employees for the current tenant.");

        employees.MapPost("/", CreateEmployee.HandleAsync)
            .AddEndpointFilter<RequireTenantAdminEndpointFilter>()
            .WithName(nameof(CreateEmployee))
            .WithSummary("Creates an employee and their login.");

        employees.MapGet("/{employeeId:guid}", GetEmployee.HandleAsync)
            .AddEndpointFilter<RequireTenantAdminEndpointFilter>()
            .WithName(nameof(GetEmployee))
            .WithSummary("Returns one employee.");

        employees.MapPatch("/{employeeId:guid}", UpdateEmployee.HandleAsync)
            .AddEndpointFilter<RequireTenantAdminEndpointFilter>()
            .WithName(nameof(UpdateEmployee))
            .WithSummary("Updates one employee.");

        employees.MapGet("/{employeeId:guid}/attendance", GetEmployeeAttendance.HandleAsync)
            .AddEndpointFilter<RequireTenantAdminEndpointFilter>()
            .WithName(nameof(GetEmployeeAttendance))
            .WithSummary("Returns one employee's attendance calendar.");

        employees.MapGet("/{employeeId:guid}/leave", GetEmployeeLeave.HandleAsync)
            .AddEndpointFilter<RequireTenantAdminEndpointFilter>()
            .WithName(nameof(GetEmployeeLeave))
            .WithSummary("Returns one employee's leave balances and requests.");
    }
}
