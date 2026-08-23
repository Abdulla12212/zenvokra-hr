using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Cloudesh.Application.Common.Errors;

/// <summary>
/// Turns unhandled exceptions into RFC 9457 problem details, so a client never sees
/// a stack trace or an empty 500 body.
/// </summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetailsService;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(
        IProblemDetailsService problemDetailsService,
        ILogger<GlobalExceptionHandler> logger)
    {
        _problemDetailsService = problemDetailsService;
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        (int statusCode, string title, string detail) = Describe(exception);

        Log(exception, statusCode);

        httpContext.Response.StatusCode = statusCode;

        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails =
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
            },
        });
    }

    private static (int StatusCode, string Title, string Detail) Describe(Exception exception) => exception switch
    {
        TenantNotResolvedException tenantNotResolved => (
            StatusCodes.Status400BadRequest,
            "Tenant not resolved",
            tenantNotResolved.Message),

        // Deliberately indistinguishable from a genuine miss: a caller must not be
        // able to probe which ids exist in other tenants.
        CrossTenantOperationException => (
            StatusCodes.Status404NotFound,
            "Not found",
            "The requested resource does not exist."),

        _ => (
            StatusCodes.Status500InternalServerError,
            "Unexpected error",
            "An unexpected error occurred. If it keeps happening, quote the trace id from this response."),
    };

    private void Log(Exception exception, int statusCode)
    {
        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception returning {StatusCode}.", statusCode);
        }
        else
        {
            _logger.LogWarning(exception, "Request rejected with {StatusCode}.", statusCode);
        }
    }
}
