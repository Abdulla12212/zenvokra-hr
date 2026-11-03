using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zenvokra.Application.Common.Endpoints;
using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Domain.Leave;
using Zenvokra.Application.Features.Employees;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Leave;

public static class CreateLeaveRequest
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [StringLength(32)]
        public string Type { get; init; } = string.Empty;

        public DateOnly From { get; init; }

        public DateOnly To { get; init; }

        [StringLength(400)]
        public string Note { get; init; } = string.Empty;
    }

    public static async Task<Results<Created<ListLeaveRequests.Response>, NotFound, ProblemHttpResult>> HandleAsync(
        Request request,
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

        string type = request.Type.Trim();

        if (!LeaveTypes.All.Contains(type))
        {
            return TypedResults.Problem(
                title: "Unknown leave type",
                detail: "Type must be Annual, Casual, or Sick.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (request.From == default || request.To == default || request.To < request.From)
        {
            return TypedResults.Problem(
                title: "Invalid dates",
                detail: "Choose a start date on or before the end date.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        HashSet<DateOnly> holidays = await LeaveReadModel.HolidayDatesAsync(dbContext, cancellationToken);
        int days = WorkingDays.Count(request.From, request.To, holidays);

        if (days == 0)
        {
            return TypedResults.Problem(
                title: "No working days",
                detail: "That range is only weekends or closed days.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        IReadOnlyList<LeaveReadModel.RequestRow> existing =
            await LeaveReadModel.ActiveRequestsAsync(dbContext, employee.Id, cancellationToken);

        LeaveReadModel.RequestRow? sameRange = existing.FirstOrDefault(row =>
            row.Status == LeaveStatuses.Pending
            && row.StartDate == request.From
            && row.EndDate == request.To);

        TimeZoneInfo zone = EmployeeClock.ResolveTimeZone(employee.TimeZone);
        DateOnly today = EmployeeClock.Today(timeProvider, employee.TimeZone);

        if (sameRange is not null)
        {
            Domain.Leave.LeaveRequest tracked = await dbContext.LeaveRequests
                .SingleAsync(row => row.Id == sameRange.Id, cancellationToken);

            tracked.Type = type;
            tracked.Note = request.Note.Trim();
            tracked.Days = days;
            await dbContext.SaveChangesAsync(cancellationToken);

            IReadOnlyList<LeaveReadModel.BalanceRow> updatedBalances =
                await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);
            LeaveReadModel.RequestRow? updated =
                await LeaveReadModel.GetAsync(dbContext, employee.Id, tracked.Id, cancellationToken);

            if (updated is null)
            {
                return TypedResults.NotFound();
            }

            return TypedResults.Created(
                $"{EndpointRegistration.ApiPrefix}/leave/requests/{tracked.Id}",
                LeaveReadModel.ToResponse(updated, updatedBalances, zone, today));
        }

        bool overlaps = existing.Any(row =>
            LeaveStatuses.ConsumesBalance(row.Status)
            && row.StartDate <= request.To
            && row.EndDate >= request.From);

        if (overlaps)
        {
            return TypedResults.Problem(
                title: "Dates overlap",
                detail: "Those dates overlap an existing pending or approved request.",
                statusCode: StatusCodes.Status409Conflict);
        }

        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);

        if (LeaveReadModel.Available(balances, existing, type) < days)
        {
            return TypedResults.Problem(
                title: "Not enough balance",
                detail: $"There are not enough {type.ToLowerInvariant()} days left for that range.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var created = Domain.Leave.LeaveRequest.Create(
            employee.Id,
            type,
            request.From,
            request.To,
            days,
            LeaveStatuses.Pending,
            employee.ManagerName,
            request.Note.Trim(),
            timeProvider.GetUtcNow());

        dbContext.LeaveRequests.Add(created);
        await dbContext.SaveChangesAsync(cancellationToken);

        IReadOnlyList<LeaveReadModel.BalanceRow> afterBalances =
            await LeaveReadModel.BalancesAsync(dbContext, employee.Id, cancellationToken);
        LeaveReadModel.RequestRow mapped = new(
            created.Id,
            created.Type,
            created.StartDate,
            created.EndDate,
            created.Days,
            created.Status,
            created.ApproverName,
            created.Note,
            created.SentAtUtc,
            created.DecidedAtUtc);

        return TypedResults.Created(
            $"{EndpointRegistration.ApiPrefix}/leave/requests/{created.Id}",
            LeaveReadModel.ToResponse(mapped, afterBalances, zone, today));
    }
}
