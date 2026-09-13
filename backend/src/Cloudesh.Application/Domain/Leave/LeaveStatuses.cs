namespace Cloudesh.Application.Domain.Leave;

public static class LeaveStatuses
{
    public const string Pending = "pending";

    public const string Approved = "approved";

    public const string Rejected = "rejected";

    public const string Cancelled = "cancelled";

    public static bool ConsumesBalance(string status) =>
        status is Approved or Pending;
}
