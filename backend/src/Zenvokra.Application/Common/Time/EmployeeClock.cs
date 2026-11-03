namespace Zenvokra.Application.Common.Time;

/// <summary>
/// Local calendar for a signed-in employee. Attendance, leave, and inbox all
/// need "today" in the person's timezone — not a frozen demo date.
/// </summary>
public static class EmployeeClock
{
    public const int LateLookbackDays = 14;

    public static TimeZoneInfo ResolveTimeZone(string timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            return TimeZoneInfo.Utc;
        }

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.Utc;
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.Utc;
        }
    }

    public static DateTimeOffset LocalNow(TimeProvider timeProvider, string timeZoneId) =>
        TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), ResolveTimeZone(timeZoneId));

    public static DateOnly Today(TimeProvider timeProvider, string timeZoneId) =>
        DateOnly.FromDateTime(LocalNow(timeProvider, timeZoneId).DateTime);

    public static TimeOnly NowTime(TimeProvider timeProvider, string timeZoneId) =>
        TimeOnly.FromDateTime(LocalNow(timeProvider, timeZoneId).DateTime);

    public static DateTimeOffset? Instant(DateOnly date, TimeOnly? time, TimeZoneInfo zone)
    {
        if (time is not TimeOnly value)
        {
            return null;
        }

        DateTime local = date.ToDateTime(value, DateTimeKind.Unspecified);
        return new DateTimeOffset(local, zone.GetUtcOffset(local));
    }

    public static DateOnly WeekMonday(DateOnly date)
    {
        int offset = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-offset);
    }

    public static string HomePath(DateOnly date, string? sheet = null)
    {
        string path = $"/?year={date.Year}&month={date.Month}&day={date.Day}";
        return sheet is null ? path : $"{path}&sheet={sheet}";
    }
}
