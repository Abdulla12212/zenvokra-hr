using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Approvals;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Approvals;

public static class DecideApproval
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [StringLength(16)]
        public string Kind { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(16)]
        public string Decision { get; init; } = string.Empty;

        [StringLength(400)]
        public string Note { get; init; } = string.Empty;
    }

    public static async Task<Results<Ok<ListApprovals.Response>, NotFound, ProblemHttpResult>> HandleAsync(
        Guid approvalId,
        Request request,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        string kind = request.Kind.Trim().ToLowerInvariant();
        string decision = request.Decision.Trim().ToLowerInvariant();

        if (kind is not ("leave" or "punch"))
        {
            return TypedResults.Problem(
                title: "Unknown kind",
                detail: "Kind must be leave or punch.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        string? status = decision switch
        {
            "approve" or "grant" => LeaveStatuses.Approved,
            "reject" or "decline" => LeaveStatuses.Rejected,
            _ => null,
        };

        if (status is null)
        {
            return TypedResults.Problem(
                title: "Unknown decision",
                detail: "Decision must be approve or reject.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (kind == "leave")
        {
            LeaveRequest? leave = await dbContext.LeaveRequests
                .SingleOrDefaultAsync(row => row.Id == approvalId, cancellationToken);

            if (leave is null)
            {
                return TypedResults.NotFound();
            }

            if (leave.Status != LeaveStatuses.Pending)
            {
                return TypedResults.Problem(
                    title: "Already decided",
                    detail: "Only a pending request can be approved or rejected.",
                    statusCode: StatusCodes.Status409Conflict);
            }

            leave.Status = status;
            leave.DecisionNote = request.Note.Trim();
            leave.DecidedAtUtc = EmployeeAppClock.NowUtc;
        }
        else
        {
            PunchCorrection? punch = await dbContext.PunchCorrections
                .SingleOrDefaultAsync(row => row.Id == approvalId, cancellationToken);

            if (punch is null)
            {
                return TypedResults.NotFound();
            }

            if (punch.Status != LeaveStatuses.Pending)
            {
                return TypedResults.Problem(
                    title: "Already decided",
                    detail: "Only a pending request can be approved or rejected.",
                    statusCode: StatusCodes.Status409Conflict);
            }

            punch.Status = status;
            punch.DecisionNote = request.Note.Trim();
            punch.DecidedAtUtc = EmployeeAppClock.NowUtc;

            if (status == LeaveStatuses.Approved)
            {
                AttendanceDay? day = await dbContext.AttendanceDays.SingleOrDefaultAsync(
                    row => row.EmployeeId == punch.EmployeeId && row.Date == punch.Date,
                    cancellationToken);

                if (day is not null)
                {
                    day.ClockIn = punch.RequestedTime;
                }
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await ListApprovals.HandleAsync(dbContext, cancellationToken);
    }
}
