using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Features.Employees;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Leave;

public static class ListLeaveRequests
{
    public sealed record Response(
        Guid Id,
        string Type,
        string DatesLabel,
        string FromLabel,
        string ToLabel,
        string RangeShort,
        string Heading,
        int Days,
        string Status,
        string StatusLabel,
        string ApproverName,
        string Note,
        string SentLabel,
        string WaitingLabel,
        string RemainingAfterLabel,
        string InboxTitle,
        string InboxDetail);

    public static async Task<Results<Ok<List<Response>>, NotFound>> HandleAsync(
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

        TimeZoneInfo zone = EmployeeClock.ResolveTimeZone(employee.TimeZone);
        DateOnly today = EmployeeClock.Today(timeProvider, employee.TimeZone);
        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);
        IReadOnlyList<LeaveReadModel.RequestRow> requests =
            await LeaveReadModel.ActiveRequestsAsync(dbContext, employee.Id, cancellationToken);

        return TypedResults.Ok(requests
            .Select(request => LeaveReadModel.ToResponse(request, balances, zone, today))
            .ToList());
    }
}
