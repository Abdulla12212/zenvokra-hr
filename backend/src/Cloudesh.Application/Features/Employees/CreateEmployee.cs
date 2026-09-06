using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Common.Endpoints;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Employees;

public static class CreateEmployee
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [StringLength(200, MinimumLength = 2)]
        public string FullName { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(320)]
        public string WorkEmail { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(32)]
        public string EmployeeNumber { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(200)]
        public string DepartmentName { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(200)]
        public string Title { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(200)]
        public string Location { get; init; } = string.Empty;

        [StringLength(40)]
        public string Phone { get; init; } = string.Empty;

        [StringLength(32)]
        public string HoursLabel { get; init; } = "09:00–18:00";

        [StringLength(200)]
        public string ManagerName { get; init; } = string.Empty;

        public DateOnly? StartedOn { get; init; }

        [StringLength(80)]
        public string TeamName { get; init; } = string.Empty;

        [StringLength(120)]
        public string DeskLabel { get; init; } = string.Empty;
    }

    public static async Task<Results<Created<EmployeeReadModel.Detail>, ProblemHttpResult>> HandleAsync(
        Request request,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        string number = request.EmployeeNumber.Trim();
        string email = request.WorkEmail.Trim();

        bool numberTaken = await dbContext.Employees
            .AnyAsync(employee => employee.EmployeeNumber == number, cancellationToken);

        if (numberTaken)
        {
            return TypedResults.Problem(
                title: "Employee number already exists",
                detail: $"An employee with number '{number}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        bool emailTaken = await dbContext.Employees
            .AnyAsync(employee => employee.WorkEmail == email, cancellationToken);

        if (emailTaken)
        {
            return TypedResults.Problem(
                title: "Work email already exists",
                detail: $"An employee with email '{email}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var employee = Employee.Create(request.FullName.Trim(), number, email);
        employee.Title = request.Title.Trim();
        employee.DepartmentName = request.DepartmentName.Trim();
        employee.Location = request.Location.Trim();
        employee.Phone = request.Phone.Trim();
        employee.HoursLabel = string.IsNullOrWhiteSpace(request.HoursLabel)
            ? employee.HoursLabel
            : request.HoursLabel.Trim();
        employee.ManagerName = string.IsNullOrWhiteSpace(request.ManagerName)
            ? employee.ManagerName
            : request.ManagerName.Trim();
        employee.StartedOn = request.StartedOn ?? employee.StartedOn;
        employee.TeamName = request.TeamName.Trim();
        employee.DeskLabel = request.DeskLabel.Trim();

        dbContext.Employees.Add(employee);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created(
            $"{EndpointRegistration.ApiPrefix}/employees/{employee.Id}",
            ToDetail(employee));
    }

    private static EmployeeReadModel.Detail ToDetail(Employee employee) =>
        new(
            employee.Id,
            employee.FullName,
            employee.EmployeeNumber,
            employee.WorkEmail,
            employee.Title,
            employee.DepartmentName,
            employee.Location,
            employee.ManagerName,
            employee.StartedOn,
            employee.HoursLabel,
            employee.WorkingDaysLabel,
            employee.TimeZone,
            employee.EmergencyContact,
            employee.EmploymentType,
            employee.Phone,
            employee.TeamName,
            employee.DeskLabel,
            employee.Status,
            employee.IsAdmin);
}
