using Cloudesh.Application.Infrastructure.Persistence;

namespace Cloudesh.Api.Startup;

internal static class WebApplicationExtensions
{
    /// <summary>
    /// Applies migrations and seeds demo data, if <see cref="DatabaseOptions"/> asks
    /// for it. Runs before the server accepts traffic so the first request never hits
    /// a half-built schema.
    /// </summary>
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        await using var scope = app.Services.CreateAsyncScope();

        var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();

        await initializer.InitializeAsync(app.Lifetime.ApplicationStopping);
    }
}
