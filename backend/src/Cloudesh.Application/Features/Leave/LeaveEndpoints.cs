using Cloudesh.Application.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Features.Leave;

public sealed class LeaveEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var leave = routes.MapGroup("/leave").WithTags("Leave");

        leave.MapGet("/balances", ListLeaveBalances.HandleAsync)
            .WithName(nameof(ListLeaveBalances))
            .WithSummary("Returns remaining leave by type for the current employee.");

        leave.MapGet("/requests", ListLeaveRequests.HandleAsync)
            .WithName(nameof(ListLeaveRequests))
            .WithSummary("Lists the current employee's leave requests.");

        leave.MapGet("/requests/{requestId:guid}", GetLeaveRequest.HandleAsync)
            .WithName(nameof(GetLeaveRequest))
            .WithSummary("Returns one leave request.");

        leave.MapPost("/requests", CreateLeaveRequest.HandleAsync)
            .WithName(nameof(CreateLeaveRequest))
            .WithSummary("Creates a pending leave request for the current employee.");

        leave.MapPost("/requests/{requestId:guid}/cancel", CancelLeaveRequest.HandleAsync)
            .WithName(nameof(CancelLeaveRequest))
            .WithSummary("Cancels a pending leave request.");
    }
}
