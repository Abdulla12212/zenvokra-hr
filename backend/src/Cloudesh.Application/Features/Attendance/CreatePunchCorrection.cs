using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Common.Endpoints;
using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Approvals;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Attendance;

public static class CreatePunchCorrection
{
    public sealed record Request
    {
        public DateOnly Date { get; init; }

        [Required(AllowEmptyStrings = false)]
        [StringLength(8)]
        public string RequestedTime { get; init; } = string.Empty;

        [StringLength(400)]
        public string Note { get; init; } = string.Empty;
    }

    public sealed record Response(
        Guid Id,
        DateOnly Date,
        string RecordedTime,
        string RequestedTime,
        string Status,
        string Note);

    public static async Task<Results<Created<Response>, NotFound, ProblemHttpResult>> HandleAsync(
        Request request,
        HttpContext httpContext,
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        EmployeeReadModel.Detail? employee = await CurrentEmployee.GetAsync(
            httpContext,
            dbContext,
            cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        if (request.Date == default || !AttendanceTimes.TryParseTime(request.RequestedTime, out TimeOnly requested))
        {
            return TypedResults.Problem(
                title: "Invalid correction",
                detail: "Choose a date and a requested time as HH:mm.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        AttendanceDay? day = await dbContext.AttendanceDays
            .AsNoTracking()
            .SingleOrDefaultAsync(
                row => row.EmployeeId == employee.Id && row.Date == request.Date,
                cancellationToken);

        TimeOnly recorded = day?.ClockIn ?? AttendanceTimes.ShiftStart;

        bool pendingExists = await dbContext.PunchCorrections
            .AsNoTracking()
            .AnyAsync(
                row => row.EmployeeId == employee.Id
                    && row.Date == request.Date
                    && row.Status == LeaveStatuses.Pending,
                cancellationToken);

        if (pendingExists)
        {
            return TypedResults.Problem(
                title: "Already pending",
                detail: "A punch correction for that date is already waiting on approval.",
                statusCode: StatusCodes.Status409Conflict);
        }

        PunchCorrection created = PunchCorrection.Create(
            employee.Id,
            request.Date,
            recorded,
            requested,
            request.Note.Trim(),
            timeProvider.GetUtcNow());

        dbContext.PunchCorrections.Add(created);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created(
            $"{EndpointRegistration.ApiPrefix}/attendance/corrections/{created.Id}",
            new Response(
                created.Id,
                created.Date,
                DateLabels.Time(created.RecordedTime),
                DateLabels.Time(created.RequestedTime),
                created.Status,
                created.Note));
    }
}
