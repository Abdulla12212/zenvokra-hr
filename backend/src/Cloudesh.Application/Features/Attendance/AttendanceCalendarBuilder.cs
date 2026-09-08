using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Holidays;
using Cloudesh.Application.Domain.Leave;

namespace Cloudesh.Application.Features.Attendance;

internal static class AttendanceCalendarBuilder
{
    public static List<GetAttendanceCalendar.Cell> Build(
        AttendanceComposer.Context context,
        DateOnly monthStart,
        int selectedDay)
    {
        bool clockedIn = AttendanceTimes.IsClockedIn(AttendanceComposer.Today(context));
        HashSet<DateOnly> holidays = context.Holidays.Select(holiday => holiday.Date).ToHashSet();
        HashSet<DateOnly> leaveDays = LeaveDays(context.PendingLeave);
        DateOnly selected = SafeDate(monthStart, selectedDay);
        HashSet<DateOnly> selectedRange = RangeFor(selected, context.PendingLeave);

        int leading = ((int)monthStart.DayOfWeek + 6) % 7;
        int daysInMonth = DateTime.DaysInMonth(monthStart.Year, monthStart.Month);
        var cells = new List<GetAttendanceCalendar.Cell>(42);

        for (int slot = 0; slot < 42; slot++)
        {
            int dayNumber = slot - leading + 1;

            if (dayNumber < 1 || dayNumber > daysInMonth)
            {
                cells.Add(Empty());
                continue;
            }

            DateOnly date = new(monthStart.Year, monthStart.Month, dayNumber);
            AttendanceDay? stamp = context.Days.FirstOrDefault(day => day.Date == date);
            bool isToday = date == EmployeeAppClock.Today;
            bool weekend = WorkingDays.IsWeekend(date);
            bool holiday = holidays.Contains(date);
            bool leave = leaveDays.Contains(date);
            bool late = AttendanceTimes.IsLate(stamp?.ClockIn);
            bool present = stamp?.ClockIn is not null && !isToday;
            bool futureWeekday = date > EmployeeAppClock.Today
                && !weekend
                && !leave
                && !holiday
                && date.Month == EmployeeAppClock.Today.Month;
            bool septWeekday = monthStart.Month == 9 && !weekend && !holiday;

            string kind = "scheduled";
            if (weekend && !holiday) kind = "weekend";
            if (present && !late && !isToday) kind = "present";
            if (late) kind = "late";
            if (leave) kind = "leave";
            if (holiday) kind = "closed";
            if (isToday) kind = "today";

            string? metaPrimary = null;
            string? metaSecondary = null;
            bool showPlane = false;

            if (isToday && clockedIn && stamp is not null)
            {
                metaPrimary = DateLabels.Duration(AttendanceTimes.Worked(stamp));
                metaSecondary = "Active";
            }
            else if (isToday && !clockedIn)
            {
                metaSecondary = "Due 09:00";
            }
            else if (late && stamp?.ClockIn is TimeOnly lateIn)
            {
                int lateMinutes = Math.Max(0, (int)(lateIn - EmployeeAppClock.ShiftStart).TotalMinutes);
                metaPrimary = $"Late · {lateMinutes}m";
                metaSecondary = DateLabels.Time(lateIn);
            }
            else if (leave)
            {
                LeaveRequest? covering = Covering(date, context.PendingLeave);
                metaSecondary = covering is null ? "Leave" : $"{covering.Type} · Pending";
                showPlane = true;
            }
            else if (holiday)
            {
                metaPrimary = "Closed";
            }
            else if (present && stamp is not null)
            {
                metaPrimary = DateLabels.Duration(AttendanceTimes.Worked(stamp));
            }
            else if (futureWeekday || septWeekday)
            {
                metaSecondary = "Scheduled";
            }
            else if (weekend)
            {
                metaSecondary = "Weekend";
            }

            PunchLabels punch = Punch(stamp, weekend, isToday, clockedIn);

            cells.Add(new GetAttendanceCalendar.Cell(
                dayNumber,
                weekend,
                isToday,
                selectedRange.Contains(date) || date == selected,
                selectedRange.Contains(date),
                kind,
                metaPrimary,
                metaSecondary,
                showPlane,
                punch.ClockIn,
                punch.ClockOut,
                punch.Hours,
                punch.BreakDuration,
                punch.Note));
        }

        return cells;
    }

    private static GetAttendanceCalendar.Cell Empty() =>
        new(null, false, false, false, false, "empty", null, null, false, null, null, null, null, null);

    private sealed record PunchLabels(
        string? ClockIn,
        string? ClockOut,
        string? Hours,
        string? BreakDuration,
        string? Note);

    private static PunchLabels Punch(AttendanceDay? stamp, bool weekend, bool today, bool clockedIn)
    {
        if (weekend && stamp is null)
        {
            return new PunchLabels(null, null, "0h 00m", "0m", null);
        }

        if (stamp is null)
        {
            return new PunchLabels(null, null, null, null, null);
        }

        string? clockIn = stamp.ClockIn is TimeOnly cin ? DateLabels.Time(cin) : null;
        string? clockOut = stamp.ClockOut is TimeOnly cout ? DateLabels.Time(cout) : null;
        string? hours = stamp.ClockIn is null
            ? null
            : DateLabels.Duration(AttendanceTimes.Worked(stamp))
              + (today && clockedIn ? " (In progress)" : string.Empty);
        TimeSpan pause = AttendanceTimes.BreakLength(stamp.BreakStart, stamp.BreakEnd);
        string? breakDuration = pause <= TimeSpan.Zero
            ? null
            : pause.TotalHours >= 1
                ? DateLabels.Duration(pause)
                : $"{pause.Minutes}m";
        string? note = string.IsNullOrWhiteSpace(stamp.Note) ? null : stamp.Note;

        return new PunchLabels(clockIn, clockOut, hours, breakDuration, note);
    }

    private static LeaveRequest? Covering(DateOnly date, IEnumerable<LeaveRequest> pending) =>
        pending.FirstOrDefault(request => request.StartDate <= date && date <= request.EndDate);

    private static DateOnly SafeDate(DateOnly monthStart, int day)
    {
        int last = DateTime.DaysInMonth(monthStart.Year, monthStart.Month);
        int clamped = Math.Clamp(day, 1, last);
        return new DateOnly(monthStart.Year, monthStart.Month, clamped);
    }

    private static HashSet<DateOnly> LeaveDays(IEnumerable<LeaveRequest> pending)
    {
        var dates = new HashSet<DateOnly>();

        foreach (LeaveRequest request in pending)
        {
            for (DateOnly date = request.StartDate; date <= request.EndDate; date = date.AddDays(1))
            {
                dates.Add(date);
            }
        }

        return dates;
    }

    private static HashSet<DateOnly> RangeFor(DateOnly selected, IEnumerable<LeaveRequest> pending)
    {
        LeaveRequest? covering = pending.FirstOrDefault(request =>
            request.StartDate <= selected && selected <= request.EndDate);

        if (covering is null)
        {
            return [];
        }

        var range = new HashSet<DateOnly>();

        for (DateOnly date = covering.StartDate; date <= covering.EndDate; date = date.AddDays(1))
        {
            range.Add(date);
        }

        return range;
    }
}
