using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Features.Attendance;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Dashboard;

public static class GetDashboard
{
    public sealed record PunchRow(
        Guid EmployeeId,
        string FullName,
        string EmployeeNumber,
        string Title,
        string TimeLabel,
        string Detail,
        string Direction);

    public sealed record Response(
        int Headcount,
        int Present,
        int Remote,
        int PendingApprovals,
        int PendingPunches,
        int PendingLeaves,
        int LateToday,
        string AverageLatenessLabel,
        int OnLeave,
        int AnnualOnLeave,
        int SickOnLeave,
        IReadOnlyList<PunchRow> Activity);

    private sealed record EmployeeRow(
        Guid Id,
        string FullName,
        string EmployeeNumber,
        string Title,
        string Status);

    public static async Task<Ok<Response>> HandleAsync(
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        List<EmployeeRow> employees = await dbContext.Employees
            .AsNoTracking()
            .OrderBy(employee => employee.FullName)
            .Select(employee => new EmployeeRow(
                employee.Id,
                employee.FullName,
                employee.EmployeeNumber,
                employee.Title,
                employee.Status))
            .ToListAsync(cancellationToken);

        string timeZoneId = await dbContext.OrganizationProfiles
            .AsNoTracking()
            .Select(profile => profile.RegionTimeZone)
            .SingleOrDefaultAsync(cancellationToken) ?? "UTC";

        DateOnly today = EmployeeClock.Today(timeProvider, timeZoneId);

        int headcount = employees.Count;
        int remote = employees.Count(employee => employee.Status == EmployeeStatuses.Remote);

        List<AttendanceDay> todayDays = await dbContext.AttendanceDays
            .AsNoTracking()
            .Where(day => day.Date == today)
            .ToListAsync(cancellationToken);

        int present = todayDays.Count(AttendanceTimes.IsClockedIn);
        List<AttendanceDay> lateDays = todayDays.Where(day => AttendanceTimes.IsLate(day.ClockIn)).ToList();
        TimeSpan averageLate = TimeSpan.Zero;

        if (lateDays.Count > 0)
        {
            long ticks = lateDays
                .Select(day => day.ClockIn)
                .OfType<TimeOnly>()
                .Select(clockIn => (clockIn - AttendanceTimes.ShiftStart).Ticks)
                .Sum();
            averageLate = TimeSpan.FromTicks(ticks / lateDays.Count);
        }

        int pendingLeaves = await dbContext.LeaveRequests
            .AsNoTracking()
            .CountAsync(request => request.Status == LeaveStatuses.Pending, cancellationToken);

        int pendingPunches = await dbContext.PunchCorrections
            .AsNoTracking()
            .CountAsync(correction => correction.Status == LeaveStatuses.Pending, cancellationToken);

        List<LeaveRequest> leaveToday = await dbContext.LeaveRequests
            .AsNoTracking()
            .Where(request =>
                request.Status == LeaveStatuses.Approved
                && request.StartDate <= today
                && request.EndDate >= today)
            .ToListAsync(cancellationToken);

        Dictionary<Guid, EmployeeRow> byId = employees.ToDictionary(employee => employee.Id);

        List<PunchRow> activity = todayDays
            .OrderByDescending(day => day.ClockIn ?? TimeOnly.MinValue)
            .Take(8)
            .Select(day => ToPunchRow(day, byId))
            .ToList();

        return TypedResults.Ok(new Response(
            headcount,
            present,
            remote,
            pendingLeaves + pendingPunches,
            pendingPunches,
            pendingLeaves,
            lateDays.Count,
            averageLate == TimeSpan.Zero ? "—" : $"+{(int)averageLate.TotalMinutes}m",
            leaveToday.Count,
            leaveToday.Count(request => request.Type == LeaveTypes.Annual),
            leaveToday.Count(request => request.Type == LeaveTypes.Sick),
            activity));
    }

    private static PunchRow ToPunchRow(AttendanceDay day, IReadOnlyDictionary<Guid, EmployeeRow> byId)
    {
        EmployeeRow? employee = byId.GetValueOrDefault(day.EmployeeId);
        string name = employee?.FullName ?? "Employee";
        string number = employee?.EmployeeNumber ?? string.Empty;
        string title = employee?.Title ?? string.Empty;
        bool late = AttendanceTimes.IsLate(day.ClockIn);
        string time = day.ClockIn is TimeOnly clockIn ? DateLabels.Time(clockIn) : "—";
        int lateMinutes = day.ClockIn is TimeOnly lateIn
            ? (int)(lateIn - AttendanceTimes.ShiftStart).TotalMinutes
            : 0;
        string detail = day.OnBreak
            ? "Break punch"
            : day.ClockOut is not null
                ? "End of shift"
                : late
                    ? $"+{lateMinutes}m late"
                    : "On-time";
        string direction = day.ClockOut is null && !day.OnBreak ? "In" : "Out";
        return new PunchRow(day.EmployeeId, name, number, title, time, detail, direction);
    }
}
