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
            .WithSummary("Returns the employee-app persona (prefer EMP-1024).");

        employees.MapGet("/", ListEmployees.HandleAsync)
            .WithName(nameof(ListEmployees))
            .WithSummary("Lists employees for the current tenant.");

        employees.MapPost("/", CreateEmployee.HandleAsync)
            .WithName(nameof(CreateEmployee))
            .WithSummary("Creates an employee in the current tenant.");

        employees.MapGet("/{employeeId:guid}", GetEmployee.HandleAsync)
            .WithName(nameof(GetEmployee))
            .WithSummary("Returns one employee.");

        employees.MapPatch("/{employeeId:guid}", UpdateEmployee.HandleAsync)
            .WithName(nameof(UpdateEmployee))
            .WithSummary("Updates one employee.");

        employees.MapGet("/{employeeId:guid}/leave", GetEmployeeLeave.HandleAsync)
            .WithName(nameof(GetEmployeeLeave))
            .WithSummary("Returns leave balances and requests for one employee.");

        employees.MapGet("/{employeeId:guid}/attendance", GetEmployeeAttendance.HandleAsync)
            .WithName(nameof(GetEmployeeAttendance))
            .WithSummary("Returns the attendance calendar for one employee.");
    }
}
