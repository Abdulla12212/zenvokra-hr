using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;

namespace Zenvokra.Api.Startup;

/// <summary>
/// Host wiring for PaaS deploy (Render in front of Neon). Not feature code —
/// keep it out of <c>Program.cs</c> the same way database init already is.
/// </summary>
internal static class PlatformHostingExtensions
{
    /// <summary>
    /// Render (and other PaaS) inject <c>PORT</c> and route public traffic there.
    /// Local Compose keeps listening on 8080 via <c>ASPNETCORE_HTTP_PORTS</c>.
    /// </summary>
    public static void ListenOnPlatformPort(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        string? port = Environment.GetEnvironmentVariable("PORT");
        if (int.TryParse(port, out int parsed) && parsed is > 0 and < 65536)
        {
            builder.WebHost.UseUrls($"http://0.0.0.0:{parsed}");
        }
    }

    /// <summary>
    /// Render terminates TLS. Without this, cookie auth never sees HTTPS and
    /// <c>CookieSecurePolicy.Always</c> drops the session cookie.
    /// </summary>
    public static void AddForwardedHeadersBehindProxy(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            // Render's load-balancer addresses are not the loopback defaults.
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
    }

    public static void MapPlatformHealthChecks(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        // Process-up only. Render's deploy probe hits this while Neon compute
        // is still waking; a database check here would fail the deploy.
        app.MapHealthChecks("/health", new HealthCheckOptions
        {
            Predicate = static _ => false,
        });

        app.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = static check => check.Tags.Contains("ready"),
        });
    }

    /// <summary>
    /// Serves the Vite build from <c>wwwroot</c> so the SPA and API share an origin
    /// on Render. No-ops in the API-only Compose image, which has no <c>index.html</c>.
    /// </summary>
    public static void MapSpaFallback(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        string? webRoot = app.Environment.WebRootPath;
        if (string.IsNullOrEmpty(webRoot)
            || !File.Exists(Path.Combine(webRoot, "index.html")))
        {
            return;
        }

        app.MapFallbackToFile("index.html");
    }

    public static void UseSpaStaticFiles(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        string? webRoot = app.Environment.WebRootPath;
        if (string.IsNullOrEmpty(webRoot)
            || !File.Exists(Path.Combine(webRoot, "index.html")))
        {
            return;
        }

        app.UseDefaultFiles();
        app.UseStaticFiles();
    }
}
