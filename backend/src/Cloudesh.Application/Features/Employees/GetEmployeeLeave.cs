using Cloudesh.Application.Features.Leave;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Employees;

public static class GetEmployeeLeave
{
    public sealed record Response(
        IReadOnlyList<ListLeaveBalances.Response> Balances,
        IReadOnlyList<ListLeaveRequests.Response> Requests);

    public static async Task<Results<Ok<Response>, NotFound>> HandleAsync(
        Guid employeeId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        CurrentEmployee.Info? employee =
            await CurrentEmployee.GetByIdAsync(dbContext, employeeId, cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);
        IReadOnlyList<LeaveReadModel.RequestRow> requests =
            await LeaveReadModel.ActiveRequestsAsync(dbContext, employee.Id, cancellationToken);

        return TypedResults.Ok(new Response(
            balances.Select(balance => new ListLeaveBalances.Response(balance.Type, balance.Remaining, balance.Total))
                .ToList(),
            requests.Select(request => LeaveReadModel.ToResponse(request, balances)).ToList()));
    }
}
