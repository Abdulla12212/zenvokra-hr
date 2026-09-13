using Cloudesh.Application.Common.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Features.Attendance;

public sealed class AttendanceEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var attendance = routes.MapGroup("/attendance")
            .WithTags("Attendance")
            .AddEndpointFilter<RequireEmployeeEndpointFilter>();

        attendance.MapGet("", GetAttendance.HandleAsync)
            .WithName(nameof(GetAttendance))
            .WithSummary("Returns today's shift and this week's quota.");

        attendance.MapGet("/calendar", GetAttendanceCalendar.HandleAsync)
            .WithName(nameof(GetAttendanceCalendar))
            .WithSummary("Returns Home calendar cells for a month.");

        attendance.MapGet("/log", GetPunchLog.HandleAsync)
            .WithName(nameof(GetPunchLog))
            .WithSummary("Returns the last three days of punch log.");

        attendance.MapGet("/stamps", GetStamp.HandleAsync)
            .WithName(nameof(GetStamp))
            .WithSummary("Returns the stamp draft for a calendar date.");

        attendance.MapPut("/stamps", SaveStamp.HandleAsync)
            .WithName(nameof(SaveStamp))
            .WithSummary("Saves a day's stamps immediately, with no approval.");

        attendance.MapPost("/clock-in", ClockIn.HandleAsync)
            .WithName(nameof(ClockIn))
            .WithSummary("Punches the signed-in employee in.");

        attendance.MapPost("/clock-out", ClockOut.HandleAsync)
            .WithName(nameof(ClockOut))
            .WithSummary("Punches the signed-in employee out.");

        attendance.MapPost("/break", ToggleBreak.HandleAsync)
            .WithName(nameof(ToggleBreak))
            .WithSummary("Starts or ends a break on today's open shift.");

        attendance.MapPost("/late-banner/dismiss", DismissLateBanner.HandleAsync)
            .WithName(nameof(DismissLateBanner))
            .WithSummary("Hides the late-day banner.");
    }
}
