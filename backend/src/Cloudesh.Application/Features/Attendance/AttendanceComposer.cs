using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Holidays;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Attendance;

internal static class AttendanceComposer
{
    public sealed record Context(
        EmployeeReadModel.Detail Employee,
        IReadOnlyList<AttendanceDay> Days,
        IReadOnlyList<CompanyHoliday> Holidays,
        IReadOnlyList<LeaveRequest> PendingLeave,
        DateOnly Today,
        TimeOnly NowTime,
        DateTimeOffset NowUtc,
        TimeZoneInfo TimeZone);

    public static async Task<Context?> LoadAsync(
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
            return null;
        }

        List<AttendanceDay> days = await dbContext.AttendanceDays
            .AsNoTracking()
            .Where(day => day.EmployeeId == employee.Id)
            .ToListAsync(cancellationToken);

        List<CompanyHoliday> holidays = await dbContext.CompanyHolidays
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        List<LeaveRequest> pending = await dbContext.LeaveRequests
            .AsNoTracking()
            .Where(request => request.EmployeeId == employee.Id && request.Status == LeaveStatuses.Pending)
            .ToListAsync(cancellationToken);

        TimeZoneInfo zone = EmployeeClock.ResolveTimeZone(employee.TimeZone);

        return new Context(
            employee,
            days,
            holidays,
            pending,
            EmployeeClock.Today(timeProvider, employee.TimeZone),
            EmployeeClock.NowTime(timeProvider, employee.TimeZone),
            timeProvider.GetUtcNow(),
            zone);
    }

    public static AttendanceDay? Today(Context context) =>
        context.Days.FirstOrDefault(day => day.Date == context.Today);

    public static AttendanceDay? LatestUnfixedLate(Context context)
    {
        DateOnly windowStart = context.Today.AddDays(1 - EmployeeClock.LateLookbackDays);

        return context.Days
            .Where(day =>
                day.Date >= windowStart
                && day.Date <= context.Today
                && AttendanceTimes.IsLate(day.ClockIn)
                && !day.LateNoticeDismissed)
            .OrderByDescending(day => day.Date)
            .FirstOrDefault();
    }

    public static GetAttendance.Response Snapshot(Context context)
    {
        AttendanceDay? today = Today(context);
        AttendanceDay? lateDay = LatestUnfixedLate(context);
        bool clockedIn = AttendanceTimes.IsClockedIn(today);
        TimeSpan worked = today is null
            ? TimeSpan.Zero
            : AttendanceTimes.Worked(today, context.Today, context.NowTime);
        bool lateDayFixed = lateDay is null;
        string? lateIso = lateDay is null ? null : lateDay.Date.ToString("yyyy-MM-dd");
        string lateTitle = lateDay is null
            ? string.Empty
            : $"{DateLabels.DayMonth(lateDay.Date)} marked late";
        string lateDetail = lateDay?.ClockIn is TimeOnly lateIn
            ? DateLabels.Time(lateIn)
            : string.Empty;
        DateOnly monday = EmployeeClock.WeekMonday(context.Today);
        List<GetAttendance.WeekBar> weekDays = WeekBars(context, monday, clockedIn);
        TimeSpan weekTotal = WeekWorked(context, monday);
        TimeSpan overtime = Overtime(context, monday);
        int shifts = context.Days.Count(day =>
            day.Date >= monday && day.Date < monday.AddDays(5) && day.ClockIn is not null);
        TimeOnly? clockIn = today?.ClockIn;
        string clockInLabel = clockIn is TimeOnly time ? DateLabels.Time(time) : string.Empty;
        string location = Workplace(context);

        return new GetAttendance.Response(
            clockedIn,
            today is { OnBreak: true },
            clockInLabel,
            DateLabels.Timer(worked),
            DateLabels.Duration(worked),
            PercentOfShift(worked),
            DateLabels.Time(context.NowTime),
            DateLabels.Time(AttendanceTimes.ShiftEnd),
            TimeUntilOut(clockedIn, context.NowTime),
            $"{location} · ready",
            $"{location} · ready",
            !lateDayFixed,
            lateDayFixed,
            lateIso,
            lateTitle,
            lateDetail,
            $"{DateLabels.Duration(weekTotal)} / 40h",
            $"{shifts} of 5 shifts",
            clockedIn,
            $"Overtime accrued · {DateLabels.Duration(overtime)}",
            weekDays,
            ClockInDetail(clockIn),
            AttendanceTimes.BreakDetail(today),
            $"{monday.Day}–{context.Today.Day} {DateLabels.MonthName(context.Today)} · {DateLabels.Duration(weekTotal)} so far",
            context.Today.ToString("yyyy-MM-dd"),
            DateLabels.LongDate(context.Today));
    }

    public static string Workplace(Context context) =>
        string.IsNullOrWhiteSpace(context.Employee.Location)
            ? "Workplace"
            : context.Employee.Location;

    private static List<GetAttendance.WeekBar> WeekBars(
        Context context,
        DateOnly monday,
        bool clockedIn)
    {
        string[] names = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        var bars = new List<GetAttendance.WeekBar>(5);

        for (int index = 0; index < 5; index++)
        {
            DateOnly date = monday.AddDays(index);
            AttendanceDay? day = context.Days.FirstOrDefault(row => row.Date == date);
            TimeSpan worked = day is null
                ? TimeSpan.Zero
                : AttendanceTimes.Worked(day, context.Today, context.NowTime);
            bool isToday = date == context.Today;
            bool late = AttendanceTimes.IsLate(day?.ClockIn);
            string tone = isToday && clockedIn
                ? "now"
                : worked == TimeSpan.Zero
                    ? "empty"
                    : late
                        ? "warn"
                        : "ok";
            string hours = worked == TimeSpan.Zero
                ? "0h"
                : late
                    ? $"{DateLabels.DurationShort(worked)}*"
                    : DateLabels.DurationShort(worked);

            bars.Add(new GetAttendance.WeekBar(
                names[index].ToLowerInvariant(),
                names[index],
                hours,
                PercentOfShift(worked),
                tone));
        }

        return bars;
    }

    private static TimeSpan WeekWorked(Context context, DateOnly monday) =>
        context.Days
            .Where(day => day.Date >= monday && day.Date < monday.AddDays(5))
            .Select(day => AttendanceTimes.Worked(day, context.Today, context.NowTime))
            .Aggregate(TimeSpan.Zero, (sum, part) => sum + part);

    private static TimeSpan Overtime(Context context, DateOnly monday) =>
        context.Days
            .Where(day => day.Date >= monday && day.Date < monday.AddDays(5))
            .Select(day => AttendanceTimes.Worked(day, context.Today, context.NowTime))
            .Select(worked => worked > AttendanceTimes.StandardDay ? worked - AttendanceTimes.StandardDay : TimeSpan.Zero)
            .Aggregate(TimeSpan.Zero, (sum, part) => sum + part);

    private static int PercentOfShift(TimeSpan worked)
    {
        if (worked <= TimeSpan.Zero)
        {
            return 0;
        }

        int percent = (int)Math.Round(worked.TotalMinutes / AttendanceTimes.StandardDay.TotalMinutes * 100);
        return Math.Clamp(percent, 0, 100);
    }

    private static string TimeUntilOut(bool clockedIn, TimeOnly nowTime)
    {
        if (!clockedIn)
        {
            return string.Empty;
        }

        TimeSpan left = AttendanceTimes.ShiftEnd - nowTime;
        return left > TimeSpan.Zero ? $"{DateLabels.Duration(left)} left" : "Shift end";
    }

    private static string ClockInDetail(TimeOnly? clockIn)
    {
        if (clockIn is not TimeOnly time)
        {
            return "—";
        }

        return AttendanceTimes.IsLate(time)
            ? $"{DateLabels.Time(time)} · Late"
            : $"{DateLabels.Time(time)} · On-time";
    }
}
