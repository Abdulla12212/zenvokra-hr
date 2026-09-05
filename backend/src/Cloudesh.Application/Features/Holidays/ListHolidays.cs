using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Holidays;

public static class ListHolidays
{
    public sealed record Response(DateOnly Date, string Name, string Detail);

    public static async Task<Ok<List<Response>>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        List<Response> holidays = await dbContext.CompanyHolidays
            .AsNoTracking()
            .OrderBy(holiday => holiday.Date)
            .Select(holiday => new Response(holiday.Date, holiday.Name, holiday.Detail))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(holidays);
    }
}
