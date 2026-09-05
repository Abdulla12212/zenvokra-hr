using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Holidays;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Attendance;

internal static class AttendanceComposer
{
    public sealed record Context(
        CurrentEmployee.Info Employee,
        IReadOnlyList<AttendanceDay> Days,
        IReadOnlyList<CompanyHoliday> Holidays,
        IReadOnlyList<LeaveRequest> PendingLeave);

    public static async Task<Context?> LoadAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        CurrentEmployee.Info? employee = await CurrentEmployee.GetAsync(dbContext, cancellationToken);

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

        return new Context(employee, days, holidays, pending);
    }

    public static AttendanceDay? Today(Context context) =>
        context.Days.FirstOrDefault(day => day.Date == EmployeeAppClock.Today);

    public static AttendanceDay? LateExample(Context context) =>
        context.Days.FirstOrDefault(day => day.Date == new DateOnly(2026, 8, 19));

    public static GetAttendance.Response Snapshot(Context context)
    {
        AttendanceDay? today = Today(context);
        AttendanceDay? lateDay = LateExample(context);
        bool clockedIn = AttendanceTimes.IsClockedIn(today);
        TimeSpan worked = today is null ? TimeSpan.Zero : AttendanceTimes.Worked(today);
        bool lateDayFixed = lateDay is null || !AttendanceTimes.IsLate(lateDay.ClockIn);
        DateOnly monday = EmployeeAppClock.WeekMonday(EmployeeAppClock.Today);
        List<GetAttendance.WeekBar> weekDays = WeekBars(context, monday, clockedIn);
        TimeSpan weekTotal = WeekWorked(context, monday);
        TimeSpan overtime = Overtime(context, monday);
        int shifts = context.Days.Count(day =>
            day.Date >= monday && day.Date < monday.AddDays(5) && day.ClockIn is not null);
        TimeOnly? clockIn = today?.ClockIn;
        string clockInLabel = clockIn is TimeOnly time ? DateLabels.Time(time) : string.Empty;

        return new GetAttendance.Response(
            clockedIn,
            today is { OnBreak: true },
            clockInLabel,
            DateLabels.Timer(worked),
            DateLabels.Duration(worked),
            PercentOfShift(worked),
            DateLabels.Time(EmployeeAppClock.NowTime),
            DateLabels.Time(EmployeeAppClock.ShiftEnd),
            TimeUntilOut(clockedIn),
            $"{context.Employee.Location} · IP verified",
            $"{context.Employee.Location} · ready",
            !lateDayFixed && lateDay is not { LateNoticeDismissed: true },
            lateDayFixed,
            $"{DateLabels.Duration(weekTotal)} / 40h",
            $"{shifts} of 5 shifts",
            clockedIn,
            $"Overtime accrued · {DateLabels.Duration(overtime)}",
            weekDays,
            ClockInDetail(clockIn),
            AttendanceTimes.BreakDetail(today),
            $"{monday.Day}–{EmployeeAppClock.Today.Day} {DateLabels.MonthName(EmployeeAppClock.Today)} · {DateLabels.Duration(weekTotal)} so far");
    }

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
            TimeSpan worked = day is null ? TimeSpan.Zero : AttendanceTimes.Worked(day);
            bool isToday = date == EmployeeAppClock.Today;
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
            .Select(AttendanceTimes.Worked)
            .Aggregate(TimeSpan.Zero, (sum, part) => sum + part);

    private static TimeSpan Overtime(Context context, DateOnly monday) =>
        context.Days
            .Where(day => day.Date >= monday && day.Date < monday.AddDays(5))
            .Select(AttendanceTimes.Worked)
            .Select(worked => worked > EmployeeAppClock.StandardDay ? worked - EmployeeAppClock.StandardDay : TimeSpan.Zero)
            .Aggregate(TimeSpan.Zero, (sum, part) => sum + part);

    private static int PercentOfShift(TimeSpan worked)
    {
        if (worked <= TimeSpan.Zero)
        {
            return 0;
        }

        int percent = (int)Math.Round(worked.TotalMinutes / EmployeeAppClock.StandardDay.TotalMinutes * 100);
        return Math.Clamp(percent, 0, 100);
    }

    private static string TimeUntilOut(bool clockedIn)
    {
        if (!clockedIn)
        {
            return string.Empty;
        }

        TimeSpan left = EmployeeAppClock.ShiftEnd - EmployeeAppClock.NowTime;
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
