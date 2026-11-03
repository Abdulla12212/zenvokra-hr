using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Zenvokra.Application.Common.Endpoints;

namespace Zenvokra.Application.Features.Auth;

public sealed class AuthEndpoints : IEndpointGroup
{
    public EndpointAudience Audience => EndpointAudience.Anonymous;

    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        var auth = routes.MapGroup("/auth").WithTags("Auth");

        auth.MapPost("/login", Login.HandleAsync)
            .WithName(nameof(Login))
            .WithSummary("Signs in a platform admin, tenant admin, or employee.");

        auth.MapPost("/logout", (Delegate)Logout.HandleAsync)
            .WithName(nameof(Logout))
            .WithSummary("Clears the session cookie.");

        auth.MapGet("/me", GetCurrentUser.HandleAsync)
            .WithName(nameof(GetCurrentUser))
            .WithSummary("Returns the signed-in account.");
    }
}
