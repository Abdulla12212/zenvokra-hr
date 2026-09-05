namespace Cloudesh.Application.Common.Time;

/// <summary>
/// Frozen employee-app calendar. Home, punches, and leave stay reproducible
/// against <c>docs/ux-employee</c> — Thursday 20 August 2026 in Asia/Dhaka.
/// </summary>
public static class EmployeeAppClock
{
    public static readonly DateOnly Today = new(2026, 8, 20);

    public static readonly TimeOnly NowTime = new(16, 32, 43);

    public static readonly TimeSpan DisplayOffset = TimeSpan.FromHours(6);

    public static readonly DateTimeOffset Now = new(2026, 8, 20, 16, 32, 43, DisplayOffset);

    /// <summary>
    /// Npgsql only writes <c>timestamp with time zone</c> when the offset is zero.
    /// </summary>
    public static readonly DateTimeOffset NowUtc = Now.ToUniversalTime();

    public static DateTimeOffset UtcFromDhaka(
        int year,
        int month,
        int day,
        int hour,
        int minute,
        int second = 0) =>
        new DateTimeOffset(year, month, day, hour, minute, second, DisplayOffset).ToUniversalTime();

    public static readonly TimeOnly ShiftStart = new(9, 0);

    public static readonly TimeOnly GraceEnd = new(9, 15);

    public static readonly TimeOnly ShiftEnd = new(18, 0);

    public static readonly TimeSpan StandardDay = TimeSpan.FromHours(8);

    public const int WeeklyQuotaMinutes = 40 * 60;

    public static DateOnly FirstOfMonth(string month) =>
        string.Equals(month, "september", StringComparison.OrdinalIgnoreCase)
            ? new DateOnly(2026, 9, 1)
            : new DateOnly(2026, 8, 1);

    public static DateOnly WeekMonday(DateOnly date)
    {
        int offset = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-offset);
    }
}
