using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Features.Leave;
using Zenvokra.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Zenvokra.Application.Features.Employees;

public static class GetEmployeeLeave
{
    public sealed record Response(
        IReadOnlyList<ListLeaveBalances.Response> Balances,
        IReadOnlyList<ListLeaveRequests.Response> Requests);

    public static async Task<Results<Ok<Response>, NotFound>> HandleAsync(
        Guid employeeId,
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        EmployeeReadModel.Detail? employee = await EmployeeReadModel
            .Project(dbContext.Employees.AsNoTracking().Where(row => row.Id == employeeId))
            .SingleOrDefaultAsync(cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        TimeZoneInfo zone = EmployeeClock.ResolveTimeZone(employee.TimeZone);
        DateOnly today = EmployeeClock.Today(timeProvider, employee.TimeZone);
        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);
        IReadOnlyList<LeaveReadModel.RequestRow> requests =
            await LeaveReadModel.ActiveRequestsAsync(dbContext, employee.Id, cancellationToken);

        return TypedResults.Ok(new Response(
            balances.Select(balance => new ListLeaveBalances.Response(balance.Type, balance.Remaining, balance.Total))
                .ToList(),
            requests.Select(request => LeaveReadModel.ToResponse(request, balances, zone, today)).ToList()));
    }
}
