using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Employees;

public static class GetEmployee
{
    public static async Task<Results<Ok<EmployeeReadModel.Detail>, NotFound>> HandleAsync(
        Guid employeeId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        EmployeeReadModel.Detail? employee = await EmployeeReadModel
            .Project(dbContext.Employees.AsNoTracking().Where(row => row.Id == employeeId))
            .SingleOrDefaultAsync(cancellationToken);

        return employee is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(employee);
    }
}
