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

        var inbox = routes.MapGroup("/inbox").WithTags("Inbox");

        inbox.MapGet("", ListInbox.HandleAsync)
            .WithName(nameof(ListInbox))
            .WithSummary("Returns the current employee's own inbox items.");
    }
}
