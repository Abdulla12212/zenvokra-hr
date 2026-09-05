using System.Globalization;
using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;

namespace Cloudesh.Application.Features.Attendance;

internal static class AttendanceTimes
{
    public static bool IsClockedIn(AttendanceDay? day) =>
        day is { ClockIn: not null, ClockOut: null };

    public static bool IsLate(TimeOnly? clockIn) =>
        clockIn is TimeOnly time && time > EmployeeAppClock.GraceEnd;

    public static TimeSpan BreakLength(TimeOnly? start, TimeOnly? end) =>
        start is TimeOnly from && end is TimeOnly to && to > from
            ? to - from
            : TimeSpan.Zero;

    public static TimeSpan Worked(AttendanceDay day)
    {
        if (day.ClockIn is not TimeOnly clockIn)
        {
            return TimeSpan.Zero;
        }

        TimeOnly end = day.ClockOut
            ?? (day.Date == EmployeeAppClock.Today ? EmployeeAppClock.NowTime : EmployeeAppClock.ShiftEnd);

        if (end < clockIn)
        {
            return TimeSpan.Zero;
        }

        TimeSpan total = end - clockIn;
        TimeSpan pause = BreakLength(day.BreakStart, day.BreakEnd);
        return total > pause ? total - pause : TimeSpan.Zero;
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
}
