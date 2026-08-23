using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Common.Endpoints;
using Cloudesh.Application.Domain.Departments;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Departments;

/// <summary>
/// WALKING SKELETON: <c>POST /api/departments</c>.
/// </summary>
public static class CreateDepartment
{
    /// <summary>
    /// Request body. The data annotations are enforced before the handler runs,
    /// because <c>AddValidation()</c> is registered — a failure becomes a 400 with a
    /// per-field <c>errors</c> object that the form can render directly.
    /// </summary>
    /// <remarks>
    /// Written as init-only properties rather than a positional record, and with a
    /// default rather than <c>required</c>, so that a missing field fails validation
    /// with a field-level message instead of failing JSON deserialization with an
    /// opaque one.
    /// </remarks>
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [StringLength(200, MinimumLength = 2)]
        public string Name { get; init; } = string.Empty;
    }

    public sealed record Response(Guid Id, string Name, DateTimeOffset CreatedAtUtc);

    public static async Task<Results<Created<Response>, ProblemHttpResult>> HandleAsync(
        Request request,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        string name = request.Name.Trim();

        // Scoped to the current tenant by the query filter, so two companies can each
        // have an "Engineering" department. The unique index is the real guarantee;
        // this check exists to return 409 instead of a database error.
        bool alreadyExists = await dbContext.Departments
            .AnyAsync(department => department.Name == name, cancellationToken);

        if (alreadyExists)
        {
            return TypedResults.Problem(
                title: "Department already exists",
                detail: $"A department named '{name}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var department = Department.Create(name);

        // TenantId is left unset: TenantSaveChangesInterceptor stamps it from the
        // current tenant, and refuses the insert if there is none.
        dbContext.Departments.Add(department);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created(
            $"{EndpointRegistration.ApiPrefix}/departments/{department.Id}",
            new Response(department.Id, department.Name, department.CreatedAtUtc));
    }
}
