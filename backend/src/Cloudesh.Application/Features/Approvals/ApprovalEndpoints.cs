using Cloudesh.Application.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Features.Approvals;

public sealed class ApprovalEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var approvals = routes.MapGroup("/approvals").WithTags("Approvals");

        approvals.MapGet("/", ListApprovals.HandleAsync)
            .WithName(nameof(ListApprovals))
            .WithSummary("Lists pending and recently decided requests for the tenant.");

        approvals.MapPost("/{approvalId:guid}/decide", DecideApproval.HandleAsync)
            .WithName(nameof(DecideApproval))
            .WithSummary("Approves or rejects a leave or punch-correction request.");
    }
}
