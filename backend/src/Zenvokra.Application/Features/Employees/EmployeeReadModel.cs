using Zenvokra.Application.Domain.Employees;

namespace Zenvokra.Application.Features.Employees;

public static class EmployeeReadModel
{
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
        string Status);

    public static Detail FromEntity(Employee row) =>
        new(
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
            row.Status);

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
            row.Status));
}
