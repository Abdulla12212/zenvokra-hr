using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Employees;

/// <summary>
/// <c>GET /api/employees/me</c> — the signed-in employee's HR row.
/// </summary>
public static class GetCurrentEmployee
{
    public static async Task<Results<Ok<EmployeeReadModel.Detail>, NotFound>> HandleAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        EmployeeReadModel.Detail? employee = await CurrentEmployee.GetAsync(
            httpContext,
            dbContext,
            cancellationToken);

        return employee is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(employee);
    }
}
