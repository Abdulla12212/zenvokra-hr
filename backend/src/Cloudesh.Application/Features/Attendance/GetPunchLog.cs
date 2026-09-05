using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Attendance;

public static class GetPunchLog
{
    public sealed record Entry(string Id, string Title, string Detail, string Tone, string? Action);

    public sealed record Group(string Id, string Heading, List<Entry> Entries);

    public static async Task<Results<Ok<List<Group>>, NotFound>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        AttendanceComposer.Context? context = await AttendanceComposer.LoadAsync(dbContext, cancellationToken);

        return context is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(PunchLogBuilder.Build(context));
    }
}
