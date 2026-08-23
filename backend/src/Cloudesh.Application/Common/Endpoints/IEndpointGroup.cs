using Microsoft.AspNetCore.Routing;

namespace Cloudesh.Application.Common.Endpoints;

/// <summary>
/// Implemented once per feature to map that feature's HTTP endpoints.
/// </summary>
/// <remarks>
/// Implementations are discovered by assembly scan at startup, so adding a feature
/// never means editing <c>Program.cs</c> — which also means two features added in
/// parallel never conflict over the same line of it.
/// <para>
/// Implementations must have a public parameterless constructor and hold no state;
/// dependencies belong on the handler, injected into the endpoint delegate.
/// </para>
/// </remarks>
public interface IEndpointGroup
{
    void MapEndpoints(IEndpointRouteBuilder routes);
}
