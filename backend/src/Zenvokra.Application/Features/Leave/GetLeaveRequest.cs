using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Features.Employees;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Leave;

public static class GetLeaveRequest
{
    public static async Task<Results<Ok<ListLeaveRequests.Response>, NotFound>> HandleAsync(
        Guid requestId,
        HttpContext httpContext,
        AppDbContext dbContext,
        TimeProvider timeProvider,
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

        LeaveReadModel.RequestRow? request =
            await LeaveReadModel.GetAsync(dbContext, employee.Id, requestId, cancellationToken);

        if (request is null)
        {
            return TypedResults.NotFound();
        }

        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);

        return TypedResults.Ok(LeaveReadModel.ToResponse(
            request,
            balances,
            EmployeeClock.ResolveTimeZone(employee.TimeZone),
            EmployeeClock.Today(timeProvider, employee.TimeZone)));
    }
}
