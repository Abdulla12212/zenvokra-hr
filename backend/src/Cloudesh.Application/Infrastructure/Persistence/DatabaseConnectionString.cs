using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Cloudesh.Application.Infrastructure.Persistence;

/// <summary>
/// Resolves the PostgreSQL connection string for local Compose, Render, and Neon.
/// </summary>
/// <remarks>
/// Neon (and Render) hand out a <c>postgres://</c> URI in <c>DATABASE_URL</c>. Local
/// development keeps using <c>ConnectionStrings:Default</c>. URIs are unpacked into
/// keyword form because Npgsql's builder does not parse them. Neon still needs TLS,
/// and its pooler host is not safe for EF migrations.
/// </remarks>
public static class DatabaseConnectionString
{
    public const string Name = "Default";

    /// <summary>Platform convention used by Neon and Render.</summary>
    public const string DatabaseUrlKey = "DATABASE_URL";

    /// <summary>
    /// Optional direct Neon URL. When <c>DATABASE_URL</c> points at the pooler, set this
    /// to the unpooled host so migrations can take a session-level advisory lock.
    /// </summary>
    public const string UnpooledDatabaseUrlKey = "DATABASE_URL_UNPOOLED";

    public static string Resolve(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string? configured = configuration.GetConnectionString(Name);
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return Normalize(configured);
        }

        string? databaseUrl = configuration[DatabaseUrlKey];
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            return Normalize(databaseUrl);
        }

        throw new InvalidOperationException(
            $"Connection string '{Name}' is missing. Set ConnectionStrings__{Name} " +
            $"or {DatabaseUrlKey} (the URI Neon and Render provide).");
    }

    /// <summary>
    /// Connection used to apply migrations. PgBouncer transaction pooling (Neon's
    /// <c>-pooler</c> host) cannot hold the advisory lock EF uses, so this prefers
    /// <c>DATABASE_URL_UNPOOLED</c> and otherwise strips <c>-pooler</c> from the host.
    /// </summary>
    public static string ResolveForMigrations(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string? unpooled = configuration[UnpooledDatabaseUrlKey];
        if (!string.IsNullOrWhiteSpace(unpooled))
        {
            return Normalize(unpooled);
        }

        return ForMigrations(Resolve(configuration));
    }

    public static string Normalize(string connectionString)
    {
        var builder = Open(connectionString);

        if (IsNeonHost(builder.Host))
        {
            ApplyNeonDefaults(builder);
        }

        return builder.ConnectionString;
    }

    public static string ForMigrations(string connectionString)
    {
        var builder = Open(Normalize(connectionString));

        if (builder.Host is not null && IsPoolerHost(builder.Host))
        {
            builder.Host = StripPoolerLabel(builder.Host);
            builder.NoResetOnClose = false;
        }

        return builder.ConnectionString;
    }

    internal static bool IsNeonHost(string? host) =>
        host is not null && host.EndsWith(".neon.tech", StringComparison.OrdinalIgnoreCase);

    internal static bool IsPoolerHost(string? host) =>
        host is not null && host.Contains("-pooler.", StringComparison.OrdinalIgnoreCase);

    private static NpgsqlConnectionStringBuilder Open(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        string trimmed = connectionString.Trim().Trim('"');
        return IsPostgresUri(trimmed)
            ? FromPostgresUri(trimmed)
            : new NpgsqlConnectionStringBuilder(trimmed);
    }

    private static bool IsPostgresUri(string value) =>
        value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
        || value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Neon and Render hand out <c>postgres://</c> URIs. Npgsql's builder only
    /// accepts keyword values, so the URI is unpacked here.
    /// </summary>
    private static NpgsqlConnectionStringBuilder FromPostgresUri(string uriString)
    {
        var uri = new Uri(uriString);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.IdnHost,
        };

        if (uri.Port > 0)
        {
            builder.Port = uri.Port;
        }

        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            string[] parts = uri.UserInfo.Split(':', 2);
            builder.Username = Uri.UnescapeDataString(parts[0]);
            if (parts.Length > 1)
            {
                builder.Password = Uri.UnescapeDataString(parts[1]);
            }
        }

        string database = uri.AbsolutePath.Trim('/');
        if (database.Length > 0)
        {
            builder.Database = Uri.UnescapeDataString(database);
        }

        foreach ((string key, string value) in ParseQuery(uri.Query))
        {
            ApplyUriParameter(builder, key, value);
        }

        return builder;
    }

    private static void ApplyUriParameter(NpgsqlConnectionStringBuilder builder, string key, string value)
    {
        if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase))
        {
            builder.SslMode = ParseSslMode(value);
            return;
        }

        if (key.Equals("channel_binding", StringComparison.OrdinalIgnoreCase))
        {
            builder.ChannelBinding = Enum.Parse<ChannelBinding>(value, ignoreCase: true);
            return;
        }

        if (key.Equals("application_name", StringComparison.OrdinalIgnoreCase))
        {
            builder.ApplicationName = value;
        }
    }

    private static SslMode ParseSslMode(string value)
    {
        string normalized = value.Replace("-", string.Empty, StringComparison.Ordinal);
        return Enum.Parse<SslMode>(normalized, ignoreCase: true);
    }

    private static IEnumerable<(string Key, string Value)> ParseQuery(string query)
    {
        if (string.IsNullOrEmpty(query))
        {
            yield break;
        }

        foreach (string part in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            int separator = part.IndexOf('=');
            if (separator < 0)
            {
                yield return (Uri.UnescapeDataString(part), string.Empty);
                continue;
            }

            yield return (
                Uri.UnescapeDataString(part[..separator]),
                Uri.UnescapeDataString(part[(separator + 1)..]));
        }
    }

    private static void ApplyNeonDefaults(NpgsqlConnectionStringBuilder builder)
    {
        // Neon refuses non-TLS. Prefer is Npgsql's default and would otherwise stay put
        // on a URI that omitted sslmode.
        if (builder.SslMode is SslMode.Disable or SslMode.Allow or SslMode.Prefer)
        {
            builder.SslMode = SslMode.Require;
        }

        if (builder.Host is not null && IsPoolerHost(builder.Host))
        {
            // Transaction-mode PgBouncer cannot reset a session or keep prepared
            // statements, which is what Npgsql does when it returns a connection
            // to its own pool.
            builder.NoResetOnClose = true;
            builder.MaxAutoPrepare = 0;
        }
    }

    private static string StripPoolerLabel(string host) =>
        host.Replace("-pooler", string.Empty, StringComparison.OrdinalIgnoreCase);
}
