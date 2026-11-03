using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Domain.Attendance;
using Zenvokra.Application.Domain.Holidays;
using Zenvokra.Application.Features.Attendance;
using Zenvokra.Application.Features.Leave;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Inbox;

public static class ListInbox
{
    public sealed record Response(
        string Id,
        string Kind,
        string Title,
        string Detail,
        string BadgeLabel,
        string BadgeVariant,
        string? ActionLabel,
        string? ActionTo,
        bool Unread);

    public static async Task<Results<Ok<List<Response>>, NotFound>> HandleAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        AttendanceComposer.Context? context = await AttendanceComposer.LoadAsync(
            httpContext,
            dbContext,
            timeProvider,
            cancellationToken);

        if (context is null)
        {
            return TypedResults.NotFound();
        }

        GetAttendance.Response snapshot = AttendanceComposer.Snapshot(context);
        IReadOnlyList<LeaveReadModel.BalanceRow> balances =
            await LeaveReadModel.BalancesAsync(dbContext, context.Employee.Id, cancellationToken);
        var items = new List<Response>();

        foreach (var request in context.PendingLeave.OrderBy(row => row.StartDate))
        {
            var row = new LeaveReadModel.RequestRow(
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
            ListLeaveRequests.Response mapped = LeaveReadModel.ToResponse(
                row,
                balances,
                context.TimeZone,
                context.Today);

            items.Add(new Response(
                mapped.Id.ToString(),
                "leave",
                mapped.InboxTitle,
                mapped.InboxDetail,
                "Leave",
                "late",
                "Open",
                $"/time-off/{mapped.Id}",
                Unread: true));
        }

        AttendanceDay? lateDay = AttendanceComposer.LatestUnfixedLate(context);

        if (lateDay is not null)
        {
            string clock = lateDay.ClockIn is TimeOnly time ? DateLabels.Time(time) : "Needs a stamp";
            items.Add(new Response(
                $"late-{lateDay.Date:yyyy-MM-dd}",
                "punch",
                $"{DateLabels.DayMonth(lateDay.Date)} marked late",
                clock,
                "Punch",
                "late",
                "Edit",
                EmployeeClock.HomePath(lateDay.Date, "fix-punch"),
                Unread: true));
        }

        if (snapshot.ClockedIn)
        {
            string clockIn = string.IsNullOrEmpty(snapshot.ClockInTime) ? "—" : snapshot.ClockInTime;
            items.Add(new Response(
                "checked-in",
                "in",
                $"Checked in {clockIn}",
                AttendanceComposer.Workplace(context),
                "In",
                "present",
                null,
                null,
                Unread: false));
        }

        CompanyHoliday? nextClosed = context.Holidays
            .Where(holiday => holiday.Date >= context.Today)
            .OrderBy(holiday => holiday.Date)
            .FirstOrDefault();

        if (nextClosed is not null)
        {
            items.Add(new Response(
                $"holiday-{nextClosed.Date:yyyy-MM-dd}",
                "holiday",
                $"Office closed {DateLabels.DayMonth(nextClosed.Date)}",
                nextClosed.Detail,
                "Holiday",
                "default",
                "Show on calendar",
                EmployeeClock.HomePath(nextClosed.Date),
                Unread: false));
        }

        return TypedResults.Ok(items);
    }
}
