using System.Globalization;
using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Domain.Attendance;

namespace Zenvokra.Application.Features.Attendance;

internal static class AttendanceTimes
{
    public static readonly TimeOnly ShiftStart = new(9, 0);

    public static readonly TimeOnly GraceEnd = new(9, 15);

    public static readonly TimeOnly ShiftEnd = new(18, 0);

    public static readonly TimeSpan StandardDay = TimeSpan.FromHours(8);

    public static readonly TimeSpan WeeklyQuota = TimeSpan.FromHours(40);

    public const int WeeklyQuotaMinutes = 40 * 60;

    public static TimeSpan OvertimeInWeek(TimeSpan weekWorked) =>
        weekWorked > WeeklyQuota ? weekWorked - WeeklyQuota : TimeSpan.Zero;

    public static bool IsClockedIn(AttendanceDay? day) =>
        day is not null
        && (day.OpenSince is not null || (day.ClockIn is not null && day.ClockOut is null));

    public static bool IsLate(TimeOnly? clockIn) =>
        clockIn is TimeOnly time && time > GraceEnd;

    public static TimeSpan BreakLength(TimeOnly? start, TimeOnly? end) =>
        start is TimeOnly from && end is TimeOnly to && to > from
            ? to - from
            : TimeSpan.Zero;

    public static void StartSession(AttendanceDay day, TimeOnly now)
    {
        if (IsClockedIn(day))
        {
            day.OpenSince ??= day.ClockIn ?? now;
            return;
        }

        if (day.ClockIn is null)
        {
            day.ClockIn = now;
            day.PriorWorked = TimeSpan.Zero;
            day.OpenSince = now;
            day.ClockOut = null;
            ClearBreak(day);
            return;
        }

        if (day.ClockOut is TimeOnly lastOut
            && day.PriorWorked == TimeSpan.Zero
            && day.ClockIn is TimeOnly first
            && lastOut >= first)
        {
            day.PriorWorked = lastOut - first;
        }

        day.OpenSince = now;
        day.ClockOut = null;
        ClearBreak(day);
    }

    public static void ApplyEditedStamp(
        AttendanceDay day,
        TimeOnly clockIn,
        TimeOnly clockOut,
        TimeOnly breakStart,
        TimeOnly breakEnd,
        string note,
        bool keepOpen)
    {
        day.ClockIn = clockIn;
        day.Note = note;
        TimeSpan pause = BreakLength(breakStart, breakEnd);
        if (pause > TimeSpan.Zero)
        {
            day.BreakStart = breakStart;
            day.BreakEnd = breakEnd;
        }
        else
        {
            day.BreakStart = null;
            day.BreakEnd = null;
        }

        if (keepOpen)
        {
            day.PriorWorked = TimeSpan.Zero;
            day.OpenSince = clockIn;
            day.ClockOut = null;
            return;
        }

        day.ClockOut = clockOut;
        day.OpenSince = null;
        day.OnBreak = false;
        day.PriorWorked = ClosedWorked(clockIn, clockOut);
    }

    public static TimeSpan ClosedWorked(TimeOnly clockIn, TimeOnly clockOut) =>
        clockOut >= clockIn ? clockOut - clockIn : TimeSpan.Zero;

    public static void CloseSession(AttendanceDay day, TimeOnly now)
    {
        TimeOnly? start = day.OpenSince ?? (day.ClockOut is null ? day.ClockIn : null);
        if (start is TimeOnly open && now >= open)
        {
            day.PriorWorked += now - open;
        }

        day.ClockOut = now;
        day.OpenSince = null;
        ClearBreak(day);
    }

    public static TimeSpan Worked(AttendanceDay day, DateOnly today, TimeOnly nowTime)
    {
        TimeSpan total = day.PriorWorked;

        if (day.OpenSince is TimeOnly open)
        {
            TimeOnly end = SessionEnd(day, today, nowTime);
            if (end >= open)
            {
                total += end - open;
            }
        }
        else if (total == TimeSpan.Zero && day.ClockIn is TimeOnly clockIn)
        {
            TimeOnly end = SessionEnd(day, today, nowTime);
            if (end >= clockIn)
            {
                total = end - clockIn;
            }
        }

        return total;
    }

    public static string BreakDetail(AttendanceDay? day)
    {
        if (day is { OnBreak: true })
        {
            return "On break now";
        }

        if (day?.BreakStart is TimeOnly start && day.BreakEnd is TimeOnly end)
        {
            TimeSpan length = BreakLength(start, end);
            string lengthLabel = length.TotalHours >= 1
                ? DateLabels.Duration(length)
                : $"{length.Minutes}m";
            return $"{DateLabels.Time(start)}–{DateLabels.Time(end)} · {lengthLabel}";
        }

        return "—";
    }

    public static bool TryParseTime(string value, out TimeOnly time) =>
        TimeOnly.TryParseExact(value, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);

    private static void ClearBreak(AttendanceDay day)
    {
        day.BreakStart = null;
        day.BreakEnd = null;
        day.OnBreak = false;
    }

    private static TimeOnly SessionEnd(AttendanceDay day, DateOnly today, TimeOnly nowTime) =>
        day.ClockOut ?? (day.Date == today ? nowTime : ShiftEnd);
}
