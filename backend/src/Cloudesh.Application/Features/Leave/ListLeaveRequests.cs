using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Leave;

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
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        CurrentEmployee.Info? employee = await CurrentEmployee.GetAsync(dbContext, cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);
        IReadOnlyList<LeaveReadModel.RequestRow> requests =
            await LeaveReadModel.ActiveRequestsAsync(dbContext, employee.Id, cancellationToken);

        return TypedResults.Ok(requests
            .Select(request => LeaveReadModel.ToResponse(request, balances))
            .ToList());
    }
}
