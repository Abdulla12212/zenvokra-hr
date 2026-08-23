namespace Cloudesh.Api;

/// <summary>
/// Identifies this assembly to <c>WebApplicationFactory&lt;T&gt;</c> in the integration
/// tests.
/// </summary>
/// <remarks>
/// The factory only uses the type argument to find the assembly whose entry point it
/// should boot, so an explicit marker works and avoids the usual
/// <c>WebApplicationFactory&lt;Program&gt;</c> pitfalls: the <c>Program</c> that top-level
/// statements generate is internal, and a test project with its own generated entry point
/// can shadow it.
/// </remarks>
public sealed class ApiAssemblyMarker;
