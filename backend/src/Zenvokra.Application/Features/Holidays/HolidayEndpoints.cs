using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Zenvokra.Application.Common.Endpoints;

namespace Zenvokra.Application.Features.Holidays;

public sealed class HolidayEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var holidays = routes.MapGroup("/holidays")
            .WithTags("Holidays")
            .AddEndpointFilter<RequireEmployeeEndpointFilter>();

        holidays.MapGet("", ListHolidays.HandleAsync)
            .WithName(nameof(ListHolidays))
            .WithSummary("Lists the current tenant's closed days.");
    }
}
