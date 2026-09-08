using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Employees;

public static class EmployeeReadModel
{
    public sealed record LeaveBalanceItem(string Type, int Remaining, int Total);

    public sealed record Detail(
        Guid Id,
        string FullName,
        string EmployeeNumber,
        string WorkEmail,
        string Title,
        string DepartmentName,
        string Location,
        string ManagerName,
        DateOnly StartedOn,
        string HoursLabel,
        string WorkingDaysLabel,
        string TimeZone,
        string EmergencyContact,
        string EmploymentType,
        string Phone,
        string TeamName,
        string DeskLabel,
        string Status,
        bool IsAdmin);

    public sealed record RosterItem(
        Guid Id,
        string FullName,
        string EmployeeNumber,
        string WorkEmail,
        string Title,
        string DepartmentName,
        string Location,
        string ManagerName,
        DateOnly StartedOn,
        string HoursLabel,
        string WorkingDaysLabel,
        string TimeZone,
        string EmergencyContact,
        string EmploymentType,
        string Phone,
        string TeamName,
        string DeskLabel,
        string Status,
        bool IsAdmin,
        int LeaveRemaining,
        IReadOnlyList<LeaveBalanceItem> LeaveBalances);

    public static IQueryable<Detail> Project(IQueryable<Employee> source) =>
        source.Select(row => new Detail(
            row.Id,
            row.FullName,
            row.EmployeeNumber,
            row.WorkEmail,
            row.Title,
            row.DepartmentName,
            row.Location,
            row.ManagerName,
            row.StartedOn,
            row.HoursLabel,
            row.WorkingDaysLabel,
            row.TimeZone,
            row.EmergencyContact,
            row.EmploymentType,
            row.Phone,
            row.TeamName,
            row.DeskLabel,
            row.Status,
            row.IsAdmin));

    public static async Task<IReadOnlyList<RosterItem>> WithLeaveAsync(
        AppDbContext dbContext,
        IReadOnlyList<Detail> items,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0)
        {
            return [];
        }

        List<Guid> employeeIds = items.Select(item => item.Id).ToList();

        List<LeaveAllowance> allowances = await dbContext.LeaveAllowances
            .AsNoTracking()
            .Where(allowance => employeeIds.Contains(allowance.EmployeeId))
            .OrderBy(allowance => allowance.Type)
            .ToListAsync(cancellationToken);

        List<ConsumedDays> consumed = await dbContext.LeaveRequests
            .AsNoTracking()
            .Where(request =>
                employeeIds.Contains(request.EmployeeId) && request.Status == LeaveStatuses.Approved)
            .GroupBy(request => new { request.EmployeeId, request.Type })
            .Select(group => new ConsumedDays(
                group.Key.EmployeeId,
                group.Key.Type,
                group.Sum(request => request.Days)))
            .ToListAsync(cancellationToken);

        Dictionary<(Guid EmployeeId, string Type), int> used = consumed.ToDictionary(
            row => (row.EmployeeId, row.Type),
            row => row.Days);

        ILookup<Guid, LeaveAllowance> byEmployee = allowances.ToLookup(allowance => allowance.EmployeeId);

        return items.Select(item =>
        {
            List<LeaveBalanceItem> balances = byEmployee[item.Id]
                .Select(allowance =>
                {
                    int extra = used.GetValueOrDefault((allowance.EmployeeId, allowance.Type));
                    int remaining = Math.Max(0, allowance.TotalDays - allowance.OpeningUsedDays - extra);
                    return new LeaveBalanceItem(allowance.Type, remaining, allowance.TotalDays);
                })
                .ToList();

            return ToRoster(item, balances);
        }).ToList();
    }

    private static RosterItem ToRoster(Detail detail, IReadOnlyList<LeaveBalanceItem> balances) =>
        new(
            detail.Id,
            detail.FullName,
            detail.EmployeeNumber,
            detail.WorkEmail,
            detail.Title,
            detail.DepartmentName,
            detail.Location,
            detail.ManagerName,
            detail.StartedOn,
            detail.HoursLabel,
            detail.WorkingDaysLabel,
            detail.TimeZone,
            detail.EmergencyContact,
            detail.EmploymentType,
            detail.Phone,
            detail.TeamName,
            detail.DeskLabel,
            detail.Status,
            detail.IsAdmin,
            balances.Sum(balance => balance.Remaining),
            balances);

    private sealed record ConsumedDays(Guid EmployeeId, string Type, int Days);
}
