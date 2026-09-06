using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Employees;

public static class UpdateEmployee
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
        [StringLength(200)]
        public string Title { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(200)]
        public string DepartmentName { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(200)]
        public string Location { get; init; } = string.Empty;

        [StringLength(200)]
        public string ManagerName { get; init; } = string.Empty;

        [StringLength(40)]
        public string Phone { get; init; } = string.Empty;

        [StringLength(80)]
        public string TeamName { get; init; } = string.Empty;

        [StringLength(120)]
        public string DeskLabel { get; init; } = string.Empty;

        [StringLength(32)]
        public string HoursLabel { get; init; } = string.Empty;

        [StringLength(32)]
        public string Status { get; init; } = EmployeeStatuses.Active;

        public DateOnly? StartedOn { get; init; }
    }

    public static async Task<Results<Ok<EmployeeReadModel.Detail>, NotFound, ProblemHttpResult>> HandleAsync(
        Guid employeeId,
        Request request,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        Employee? employee = await dbContext.Employees
            .SingleOrDefaultAsync(row => row.Id == employeeId, cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        string email = request.WorkEmail.Trim();
        bool emailTaken = await dbContext.Employees.AnyAsync(
            row => row.WorkEmail == email && row.Id != employeeId,
            cancellationToken);

        if (emailTaken)
        {
            return TypedResults.Problem(
                title: "Work email already exists",
                detail: $"An employee with email '{email}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        string status = string.IsNullOrWhiteSpace(request.Status)
            ? employee.Status
            : request.Status.Trim();

        if (!EmployeeStatuses.IsKnown(status))
        {
            return TypedResults.Problem(
                title: "Unknown status",
                detail: "Status must be Active, Remote, or Probation.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        employee.FullName = request.FullName.Trim();
        employee.WorkEmail = email;
        employee.Title = request.Title.Trim();
        employee.DepartmentName = request.DepartmentName.Trim();
        employee.Location = request.Location.Trim();
        employee.ManagerName = request.ManagerName.Trim();
        employee.Phone = request.Phone.Trim();
        employee.TeamName = request.TeamName.Trim();
        employee.DeskLabel = request.DeskLabel.Trim();
        employee.HoursLabel = string.IsNullOrWhiteSpace(request.HoursLabel)
            ? employee.HoursLabel
            : request.HoursLabel.Trim();
        employee.Status = status;
        employee.StartedOn = request.StartedOn ?? employee.StartedOn;

        await dbContext.SaveChangesAsync(cancellationToken);

        EmployeeReadModel.Detail? detail = await EmployeeReadModel
            .Project(dbContext.Employees.AsNoTracking().Where(row => row.Id == employee.Id))
            .SingleOrDefaultAsync(cancellationToken);

        return detail is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(detail);
    }
}
