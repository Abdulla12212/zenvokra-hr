using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Domain.Leave;
using Zenvokra.Application.Features.Employees;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Leave;

public static class CancelLeaveRequest
{
    public static async Task<Results<Ok<ListLeaveRequests.Response>, NotFound, ProblemHttpResult>> HandleAsync(
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

        Domain.Leave.LeaveRequest? request = await dbContext.LeaveRequests
            .SingleOrDefaultAsync(
                row => row.Id == requestId && row.EmployeeId == employee.Id,
                cancellationToken);

        if (request is null)
        {
            return TypedResults.NotFound();
        }

        if (request.Status != LeaveStatuses.Pending)
        {
            return TypedResults.Problem(
                title: "Cannot cancel",
                detail: "Only a pending request can be cancelled.",
                statusCode: StatusCodes.Status409Conflict);
        }

        request.Status = LeaveStatuses.Cancelled;
        await dbContext.SaveChangesAsync(cancellationToken);

        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);

        var mapped = new LeaveReadModel.RequestRow(
            request.Id,
            request.Type,
            request.StartDate,
            request.EndDate,
            request.Days,
            request.Status,
            request.ApproverName,
            request.Note,
            request.SentAtUtc,
            request.DecidedAtUtc);

        return TypedResults.Ok(LeaveReadModel.ToResponse(
            mapped,
            balances,
            EmployeeClock.ResolveTimeZone(employee.TimeZone),
            EmployeeClock.Today(timeProvider, employee.TimeZone)));
    }
}
