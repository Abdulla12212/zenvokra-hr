using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Holidays;
using Cloudesh.Application.Features.Attendance;
using Cloudesh.Application.Features.Leave;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Inbox;

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
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        AttendanceComposer.Context? context = await AttendanceComposer.LoadAsync(dbContext, cancellationToken);

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
            ListLeaveRequests.Response mapped = LeaveReadModel.ToResponse(row, balances);

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

        if (!snapshot.LateDayFixed)
        {
            items.Add(new Response(
                "late-19",
                "punch",
                "19 Aug marked late",
                "Today 08:12",
                "Punch",
                "late",
                "Edit",
                "/?sheet=fix-punch&day=19",
                Unread: true));
        }

        if (snapshot.ClockedIn)
        {
            string clockIn = string.IsNullOrEmpty(snapshot.ClockInTime) ? "—" : snapshot.ClockInTime;
            items.Add(new Response(
                "checked-in",
                "in",
                $"Checked in {clockIn}",
                context.Employee.Location,
                "In",
                "present",
                null,
                null,
                Unread: false));
        }

        CompanyHoliday? nextClosed = context.Holidays
            .Where(holiday => holiday.Date >= EmployeeAppClock.Today)
            .OrderBy(holiday => holiday.Date)
            .FirstOrDefault();

        if (nextClosed is not null)
        {
            string month = nextClosed.Date.Month == 9 ? "september" : "august";
            items.Add(new Response(
                $"holiday-{nextClosed.Date:yyyy-MM-dd}",
                "holiday",
                $"Office closed {nextClosed.Date.Day} {DateLabels.MonthName(nextClosed.Date)}",
                nextClosed.Detail,
                "Holiday",
                "default",
                "Show on calendar",
                $"/?month={month}&day={nextClosed.Date.Day}",
                Unread: false));
        }

        return TypedResults.Ok(items);
    }
}
