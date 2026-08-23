using Cloudesh.Application.Common.Pagination;
using Cloudesh.Application.Domain.Departments;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Departments;

/// <summary>
/// WALKING SKELETON: <c>GET /api/departments</c>.
/// </summary>
public static class ListDepartments
{
    /// <summary>
    /// What the client receives. Separate from the entity on purpose: an entity is a
    /// storage concern, and letting one leak into a response means every schema change
    /// becomes a breaking API change.
    /// </summary>
    public sealed record DepartmentSummary(Guid Id, string Name, DateTimeOffset CreatedAtUtc);

    public static async Task<Ok<PagedResult<DepartmentSummary>>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken,
        int page = 1,
        int pageSize = PagedResult<DepartmentSummary>.DefaultPageSize)
    {
        int pageNumber = PagedResult<DepartmentSummary>.NormalizePage(page);
        int size = PagedResult<DepartmentSummary>.NormalizePageSize(pageSize);

        // No `Where(d => d.TenantId == ...)` anywhere: the TenantIsolation query filter
        // adds it to every query against this entity. Writing it by hand is redundant,
        // and forgetting it is impossible.
        IQueryable<Department> query = dbContext.Departments.AsNoTracking();

        int totalCount = await query.CountAsync(cancellationToken);

        List<DepartmentSummary> items = await query
            .OrderBy(department => department.Name)
            .Skip((pageNumber - 1) * size)
            .Take(size)
            // Project in the database rather than materializing entities and mapping
            // in memory: only the needed columns cross the wire.
            .Select(department => new DepartmentSummary(
                department.Id,
                department.Name,
                department.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(new PagedResult<DepartmentSummary>(items, pageNumber, size, totalCount));
    }
}
