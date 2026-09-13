using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Common.Endpoints;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Features.PlatformTenants;
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
        [EmailAddress]
        [StringLength(320)]
        public string WorkEmail { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(200, MinimumLength = 8)]
        public string Password { get; init; } = string.Empty;

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
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        string number = request.EmployeeNumber.Trim();
        string email = LoginEmail.Normalize(request.WorkEmail);

        bool numberTaken = await dbContext.Employees
            .AnyAsync(employee => employee.EmployeeNumber == number, cancellationToken);

        if (numberTaken)
        {
            return TypedResults.Problem(
                title: "Employee number already exists",
                detail: $"An employee with number '{number}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        if (await PlatformEmailUniqueness.IsTakenAsync(
                dbContext,
                email,
                exceptAdminId: null,
                cancellationToken))
        {
            return TypedResults.Problem(
                title: "Email already used",
                detail: $"An account with the email '{email}' already exists.",
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
        employee.ManagerName = request.ManagerName.Trim();
        employee.StartedOn = request.StartedOn
            ?? DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);
        employee.TeamName = request.TeamName.Trim();
        employee.DeskLabel = request.DeskLabel.Trim();

        dbContext.Employees.Add(employee);
        dbContext.EmployeeAccounts.Add(EmployeeAccount.Create(employee.Id, email, request.Password));
        dbContext.LeaveAllowances.AddRange(LeaveAllowance.DefaultSet(employee.Id));
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created(
            $"{EndpointRegistration.ApiPrefix}/employees/{employee.Id}",
            EmployeeReadModel.FromEntity(employee));
    }
}
