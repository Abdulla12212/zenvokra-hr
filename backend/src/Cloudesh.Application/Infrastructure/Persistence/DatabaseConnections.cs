using Microsoft.Extensions.Configuration;

namespace Cloudesh.Application.Infrastructure.Persistence;

/// <summary>
/// Runtime and migration connection strings resolved once at startup.
/// </summary>
public sealed record DatabaseConnections(string Runtime, string Migrations)
{
    public static DatabaseConnections FromConfiguration(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        return new DatabaseConnections(
            DatabaseConnectionString.Resolve(configuration),
            DatabaseConnectionString.ResolveForMigrations(configuration));
    }
}
