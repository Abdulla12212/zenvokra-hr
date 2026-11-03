using Microsoft.EntityFrameworkCore;
using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Domain.Leave;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Leave;

internal static class LeaveReadModel
{
    public sealed record BalanceRow(string Type, int Remaining, int Total);

    public sealed record RequestRow(
        Guid Id,
        string Type,
        DateOnly StartDate,
        DateOnly EndDate,
        int Days,
        string Status,
        string ApproverName,
        string Note,
        DateTimeOffset SentAtUtc,
        DateTimeOffset? DecidedAtUtc);

    public static async Task<IReadOnlyList<BalanceRow>> BalancesAsync(
        AppDbContext dbContext,
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        List<LeaveAllowance> allowances = await dbContext.LeaveAllowances
            .AsNoTracking()
            .Where(allowance => allowance.EmployeeId == employeeId)
            .OrderBy(allowance => allowance.Type)
            .ToListAsync(cancellationToken);

        IReadOnlyList<RequestRow> requests = await ActiveRequestsAsync(dbContext, employeeId, cancellationToken);

        return allowances
            .Select(allowance => ToBalance(allowance, requests))
            .ToList();
    }

    public static async Task<IReadOnlyList<RequestRow>> ActiveRequestsAsync(
        AppDbContext dbContext,
        Guid employeeId,
        CancellationToken cancellationToken) =>
        await dbContext.LeaveRequests
            .AsNoTracking()
            .Where(request => request.EmployeeId == employeeId && request.Status != LeaveStatuses.Cancelled)
            .OrderByDescending(request => request.StartDate)
            .Select(request => new RequestRow(
                request.Id,
                request.Type,
                request.StartDate,
                request.EndDate,
                request.Days,
                request.Status,
                request.ApproverName,
                request.Note,
                request.SentAtUtc,
                request.DecidedAtUtc))
            .ToListAsync(cancellationToken);

    public static async Task<RequestRow?> GetAsync(
        AppDbContext dbContext,
        Guid employeeId,
        Guid requestId,
        CancellationToken cancellationToken) =>
        await dbContext.LeaveRequests
            .AsNoTracking()
            .Where(request => request.EmployeeId == employeeId && request.Id == requestId)
            .Select(request => new RequestRow(
                request.Id,
                request.Type,
                request.StartDate,
                request.EndDate,
                request.Days,
                request.Status,
                request.ApproverName,
                request.Note,
                request.SentAtUtc,
                request.DecidedAtUtc))
            .SingleOrDefaultAsync(cancellationToken);

    public static async Task<HashSet<DateOnly>> HolidayDatesAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        List<DateOnly> dates = await dbContext.CompanyHolidays
            .AsNoTracking()
            .Select(holiday => holiday.Date)
            .ToListAsync(cancellationToken);

        return [.. dates];
    }

    public static ListLeaveRequests.Response ToResponse(
        RequestRow request,
        IReadOnlyList<BalanceRow> balances,
        TimeZoneInfo timeZone,
        DateOnly today)
    {
        int remaining = balances.FirstOrDefault(balance => balance.Type == request.Type)?.Remaining ?? 0;
        int after = request.Status == LeaveStatuses.Pending
            ? Math.Max(0, remaining - request.Days)
            : remaining;

        string firstName = ApproverFirstName(request.ApproverName);
        string heading = DateLabels.Heading(request.StartDate, request.EndDate);
        string typeWord = request.Type.ToLowerInvariant();

        return new ListLeaveRequests.Response(
            request.Id,
            request.Type,
            DateLabels.DatesLabel(request.StartDate, request.EndDate),
            DateLabels.LongDate(request.StartDate),
            DateLabels.LongDate(request.EndDate),
            DateLabels.RangeShort(request.StartDate, request.EndDate),
            heading,
            request.Days,
            request.Status,
            StatusLabel(request, firstName),
            request.ApproverName,
            request.Note,
            SentLabel(request.SentAtUtc, timeZone),
            request.Status == LeaveStatuses.Pending
                ? $"Waiting on {(string.IsNullOrWhiteSpace(request.ApproverName) ? "your manager" : request.ApproverName)}"
                : string.Empty,
            $"{after} {typeWord} days left",
            InboxTitle(request, heading, firstName),
            InboxDetail(request, timeZone, today));
    }

    public static BalanceRow ToBalance(LeaveAllowance allowance, IReadOnlyList<RequestRow> requests)
    {
        int consumed = requests
            .Where(request => request.Type == allowance.Type && request.Status == LeaveStatuses.Approved)
            .Sum(request => request.Days);

        int remaining = Math.Max(0, allowance.TotalDays - allowance.OpeningUsedDays - consumed);
        return new BalanceRow(allowance.Type, remaining, allowance.TotalDays);
    }

    public static int Available(IReadOnlyList<BalanceRow> balances, IReadOnlyList<RequestRow> requests, string type)
    {
        int remaining = balances.FirstOrDefault(balance => balance.Type == type)?.Remaining ?? 0;
        int pending = requests
            .Where(request => request.Type == type && request.Status == LeaveStatuses.Pending)
            .Sum(request => request.Days);

        return Math.Max(0, remaining - pending);
    }

    private static string ApproverFirstName(string approverName) =>
        string.IsNullOrWhiteSpace(approverName) ? "your manager" : DateLabels.FirstName(approverName);

    private static string StatusLabel(RequestRow request, string firstName) => request.Status switch
    {
        LeaveStatuses.Pending => $"Pending · {firstName}",
        LeaveStatuses.Approved => "Approved",
        LeaveStatuses.Rejected => "Rejected",
        LeaveStatuses.Cancelled => "Cancelled",
        _ => request.Status,
    };

    private static string SentLabel(DateTimeOffset sentAtUtc, TimeZoneInfo timeZone)
    {
        DateTimeOffset local = TimeZoneInfo.ConvertTime(sentAtUtc, timeZone);
        return $"Sent {local.Day} {DateLabels.MonthName(DateOnly.FromDateTime(local.DateTime))}, {local:HH:mm}";
    }

    private static string InboxTitle(RequestRow request, string heading, string firstName) => request.Status switch
    {
        LeaveStatuses.Pending => $"{heading} waiting on {firstName}",
        LeaveStatuses.Approved => $"{request.Type} day {heading} approved",
        LeaveStatuses.Rejected => $"{request.Type} {heading} rejected",
        _ => heading,
    };

    private static string InboxDetail(RequestRow request, TimeZoneInfo timeZone, DateOnly today)
    {
        if (request.Status == LeaveStatuses.Pending)
        {
            DateTimeOffset local = TimeZoneInfo.ConvertTime(request.SentAtUtc, timeZone);
            DateOnly sentOn = DateOnly.FromDateTime(local.DateTime);
            TimeOnly sentAt = TimeOnly.FromDateTime(local.DateTime);
            return sentOn == today
                ? $"Sent today {DateLabels.Time(sentAt)}"
                : $"Sent {DateLabels.DayMonth(sentOn)}";
        }

        if (request.DecidedAtUtc is DateTimeOffset decided)
        {
            DateOnly decidedOn = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(decided, timeZone).DateTime);
            string verb = request.Status == LeaveStatuses.Approved ? "Approved" : "Rejected";
            return $"{verb} {DateLabels.DayMonth(decidedOn)}";
        }

        return string.Empty;
    }
}
