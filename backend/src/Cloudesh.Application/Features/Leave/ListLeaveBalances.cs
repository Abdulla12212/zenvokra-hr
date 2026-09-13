using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Leave;

public static class ListLeaveBalances
{
    public sealed record Response(string Type, int Remaining, int Total);

    public static async Task<Results<Ok<List<Response>>, NotFound>> HandleAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        EmployeeReadModel.Detail? employee = await CurrentEmployee.GetAsync(
            httpContext,
            dbContext,
            cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);

        return TypedResults.Ok(balances
            .Select(balance => new Response(balance.Type, balance.Remaining, balance.Total))
            .ToList());
    }
}
