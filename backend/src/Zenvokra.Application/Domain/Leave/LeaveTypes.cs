namespace Zenvokra.Application.Domain.Leave;

public static class LeaveTypes
{
    public const string Annual = "Annual";

    public const string Casual = "Casual";

    public const string Sick = "Sick";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Annual,
        Casual,
        Sick,
    };
}
