using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Domain.Approvals;
using Zenvokra.Application.Domain.Leave;
using Zenvokra.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Zenvokra.Application.Features.Approvals;

public static class ListApprovals
{
    public sealed record Item(
        Guid Id,
        string Kind,
        string Status,
        Guid EmployeeId,
        string EmployeeName,
        string EmployeeNumber,
        string Title,
        string Location,
        string Summary,
        string Detail,
        string Note,
        bool ManagerVerified,
        string RecordedLabel,
        string RequestedLabel,
        string SentLabel,
        DateTimeOffset SentAtUtc,
        DateTimeOffset? DecidedAtUtc);

    public sealed record Response(
        IReadOnlyList<Item> Pending,
        IReadOnlyList<Item> Resolved,
        int PendingPunches,
        int PendingLeaves);

    public static async Task<Ok<Response>> HandleAsync(
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var employees = await dbContext.Employees
            .AsNoTracking()
            .Select(employee => new
            {
                employee.Id,
                employee.FullName,
                employee.EmployeeNumber,
                employee.Title,
                employee.Location,
            })
            .ToDictionaryAsync(employee => employee.Id, cancellationToken);

        List<LeaveRequest> leaveRows = await dbContext.LeaveRequests
            .AsNoTracking()
            .Where(request => request.Status != LeaveStatuses.Cancelled)
            .OrderByDescending(request => request.SentAtUtc)
            .ToListAsync(cancellationToken);

        List<PunchCorrection> punchRows = await dbContext.PunchCorrections
            .AsNoTracking()
            .OrderByDescending(correction => correction.SentAtUtc)
            .ToListAsync(cancellationToken);

        string timeZoneId = await dbContext.OrganizationProfiles
            .AsNoTracking()
            .Select(profile => profile.RegionTimeZone)
            .SingleOrDefaultAsync(cancellationToken) ?? "UTC";

        TimeZoneInfo zone = EmployeeClock.ResolveTimeZone(timeZoneId);
        DateOnly today = EmployeeClock.Today(timeProvider, timeZoneId);

        List<Item> items = [];

        foreach (LeaveRequest request in leaveRows)
        {
            if (!employees.TryGetValue(request.EmployeeId, out var employee))
            {
                continue;
            }

            items.Add(new Item(
                request.Id,
                "leave",
                request.Status,
                employee.Id,
                employee.FullName,
                employee.EmployeeNumber,
                employee.Title,
                employee.Location,
                $"{request.Type} leave · {request.Days} day{(request.Days == 1 ? string.Empty : "s")}",
                DateLabels.DatesLabel(request.StartDate, request.EndDate),
                request.Note,
                ManagerVerified: true,
                string.Empty,
                string.Empty,
                SentLabel(request.SentAtUtc, zone, today),
                request.SentAtUtc,
                request.DecidedAtUtc));
        }

        foreach (PunchCorrection correction in punchRows)
        {
            if (!employees.TryGetValue(correction.EmployeeId, out var employee))
            {
                continue;
            }

            items.Add(new Item(
                correction.Id,
                "punch",
                correction.Status,
                employee.Id,
                employee.FullName,
                employee.EmployeeNumber,
                employee.Title,
                employee.Location,
                "Punch rectification",
                DateLabels.LongDate(correction.Date),
                correction.Note,
                correction.ManagerVerified,
                DateLabels.Time(correction.RecordedTime),
                DateLabels.Time(correction.RequestedTime),
                SentLabel(correction.SentAtUtc, zone, today),
                correction.SentAtUtc,
                correction.DecidedAtUtc));
        }

        List<Item> ordered = items.OrderByDescending(item => item.SentAtUtc).ToList();
        List<Item> pending = ordered.Where(item => item.Status == LeaveStatuses.Pending).ToList();
        List<Item> resolved = ordered.Where(item => item.Status != LeaveStatuses.Pending).Take(12).ToList();

        return TypedResults.Ok(new Response(
            pending,
            resolved,
            pending.Count(item => item.Kind == "punch"),
            pending.Count(item => item.Kind == "leave")));
    }

    private static string SentLabel(DateTimeOffset sentAtUtc, TimeZoneInfo timeZone, DateOnly today)
    {
        DateTimeOffset local = TimeZoneInfo.ConvertTime(sentAtUtc, timeZone);
        DateOnly sentOn = DateOnly.FromDateTime(local.DateTime);
        return sentOn == today
            ? $"Submitted today at {DateLabels.Time(TimeOnly.FromDateTime(local.DateTime))}"
            : $"Submitted {DateLabels.DayMonth(sentOn)}";
    }
}
