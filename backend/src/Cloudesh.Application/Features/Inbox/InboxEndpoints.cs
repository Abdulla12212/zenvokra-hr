using Cloudesh.Application.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Features.Inbox;

public sealed class InboxEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var inbox = routes.MapGroup("/inbox")
            .WithTags("Inbox")
            .AddEndpointFilter<RequireEmployeeEndpointFilter>();

        inbox.MapGet("", ListInbox.HandleAsync)
            .WithName(nameof(ListInbox))
            .WithSummary("Returns the signed-in employee's inbox items.");
    }
}
