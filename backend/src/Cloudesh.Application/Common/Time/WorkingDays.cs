namespace Cloudesh.Application.Common.Time;

public static class WorkingDays
{
    public static int Count(DateOnly from, DateOnly to, IReadOnlySet<DateOnly> holidays)
    {
        if (to < from)
        {
            return 0;
        }

        int days = 0;

        for (DateOnly date = from; date <= to; date = date.AddDays(1))
        {
            if (IsWorkingDay(date, holidays))
            {
                days++;
            }
        }

        return days;
    }

    public static bool IsWorkingDay(DateOnly date, IReadOnlySet<DateOnly> holidays) =>
        date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday
        && !holidays.Contains(date);

    public static bool IsWeekend(DateOnly date) =>
        date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
}
