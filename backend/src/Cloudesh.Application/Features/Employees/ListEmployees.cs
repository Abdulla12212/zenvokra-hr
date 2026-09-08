using Cloudesh.Application.Common.Pagination;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Employees;

public static class ListEmployees
{
    public static async Task<Ok<PagedResult<EmployeeReadModel.RosterItem>>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken,
        string? search = null,
        string? department = null,
        int page = 1,
        int pageSize = PagedResult<EmployeeReadModel.RosterItem>.DefaultPageSize)
    {
        int pageNumber = PagedResult<EmployeeReadModel.RosterItem>.NormalizePage(page);
        int size = PagedResult<EmployeeReadModel.RosterItem>.NormalizePageSize(pageSize);

        IQueryable<Employee> query = dbContext.Employees.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string term = search.Trim();
            query = query.Where(employee =>
                employee.FullName.Contains(term)
                || employee.EmployeeNumber.Contains(term)
                || employee.Title.Contains(term)
                || employee.WorkEmail.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(department) && department != "All")
        {
            string name = department.Trim();
            query = query.Where(employee => employee.DepartmentName == name);
        }

        int totalCount = await query.CountAsync(cancellationToken);

        List<EmployeeReadModel.Detail> details = await EmployeeReadModel
            .Project(query.OrderBy(employee => employee.FullName))
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .ToListAsync(cancellationToken);

        IReadOnlyList<EmployeeReadModel.RosterItem> items =
            await EmployeeReadModel.WithLeaveAsync(dbContext, details, cancellationToken);

        return TypedResults.Ok(
            new PagedResult<EmployeeReadModel.RosterItem>(items, pageNumber, size, totalCount));
    }
}
