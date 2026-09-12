using Cloudesh.Application.Common.Pagination;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Employees;

public static class ListEmployees
{
    public static async Task<Ok<PagedResult<EmployeeReadModel.Detail>>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken,
        string? search = null,
        int page = 1,
        int pageSize = PagedResult<EmployeeReadModel.Detail>.DefaultPageSize)
    {
        int pageNumber = PagedResult<EmployeeReadModel.Detail>.NormalizePage(page);
        int size = PagedResult<EmployeeReadModel.Detail>.NormalizePageSize(pageSize);

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

        int totalCount = await query.CountAsync(cancellationToken);

        List<EmployeeReadModel.Detail> items = await EmployeeReadModel
            .Project(query.OrderBy(employee => employee.FullName))
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(
            new PagedResult<EmployeeReadModel.Detail>(items, pageNumber, size, totalCount));
    }
}
