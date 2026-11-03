namespace Zenvokra.Application.Common.Time;

/// <summary>
/// English calendar labels. The API runs with invariant globalization, so these
/// must not go through <c>CultureInfo</c>.
/// </summary>
public static class DateLabels
{
    private static readonly string[] DayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    private static readonly string[] MonthNames =
    [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    public static string DayName(DateOnly date) => DayNames[(int)date.DayOfWeek];

    public static string MonthName(DateOnly date) => MonthNames[date.Month - 1];

    public static string LongDate(DateOnly date) =>
        $"{DayName(date)} {date.Day} {MonthName(date)} {date.Year}";

    public static string DayMonth(DateOnly date) => $"{date.Day} {MonthName(date)}";

    public static string DayMonthYear(DateOnly date) => $"{date.Day} {MonthName(date)} {date.Year}";

    public static string Time(TimeOnly time) => time.ToString("HH:mm");

    public static string Clock(TimeOnly time) =>
        time.Second == 0 ? Time(time) : time.ToString("HH:mm:ss");

    public static string FirstName(string fullName)
    {
        int space = fullName.IndexOf(' ', StringComparison.Ordinal);
        return space < 0 ? fullName : fullName[..space];
    }

    public static string Heading(DateOnly from, DateOnly to)
    {
        if (from == to)
        {
            return DayMonth(from);
        }

        if (from.Month == to.Month && from.Year == to.Year)
        {
            return $"{from.Day}–{to.Day} {MonthName(from)}";
        }

        return $"{DayMonth(from)} – {DayMonth(to)}";
    }

    public static string DatesLabel(DateOnly from, DateOnly to)
    {
        if (from == to)
        {
            return DayMonthYear(from);
        }

        if (from.Month == to.Month && from.Year == to.Year)
        {
            return $"{from.Day}–{to.Day} {MonthName(from)} {from.Year}";
        }

        return $"{DayMonthYear(from)} – {DayMonthYear(to)}";
    }

    public static string RangeShort(DateOnly from, DateOnly to)
    {
        if (from == to)
        {
            return LongDate(from);
        }

        if (from.Month == to.Month && from.Year == to.Year)
        {
            return $"{DayName(from)} {from.Day} – {DayName(to)} {to.Day} {MonthName(from)} {from.Year}";
        }

        return $"{LongDate(from)} – {LongDate(to)}";
    }

    public static string Duration(TimeSpan value)
    {
        int hours = (int)value.TotalHours;
        int minutes = value.Minutes;
        return minutes == 0 ? $"{hours}h" : $"{hours}h {minutes:00}m";
    }

    public static string DurationShort(TimeSpan value)
    {
        if (value.Minutes == 0)
        {
            return $"{(int)value.TotalHours}h";
        }

        double hours = Math.Round(value.TotalHours, 1, MidpointRounding.AwayFromZero);
        return hours == Math.Floor(hours) ? $"{(int)hours}h" : $"{hours:0.#}h";
    }

    public static string Timer(TimeSpan value) =>
        $"{(int)value.TotalHours}h {value.Minutes:00}m {value.Seconds:00}s";
}
