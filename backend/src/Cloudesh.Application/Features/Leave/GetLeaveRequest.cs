using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Leave;

public static class GetLeaveRequest
{
    public static async Task<Results<Ok<ListLeaveRequests.Response>, NotFound>> HandleAsync(
        Guid requestId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        CurrentEmployee.Info? employee = await CurrentEmployee.GetAsync(dbContext, cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        LeaveReadModel.RequestRow? request =
            await LeaveReadModel.GetAsync(dbContext, employee.Id, requestId, cancellationToken);

        if (request is null)
        {
            return TypedResults.NotFound();
        }

        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);

        return TypedResults.Ok(LeaveReadModel.ToResponse(request, balances));
    }
}
