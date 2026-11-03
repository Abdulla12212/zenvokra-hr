namespace Zenvokra.Application.Domain.Employees;

public static class EmployeeStatuses
{
    public const string Active = "Active";

    public const string Remote = "Remote";

    public const string Probation = "Probation";

    public static readonly string[] All = [Active, Remote, Probation];

    public static bool IsKnown(string status) => All.Contains(status);
}
