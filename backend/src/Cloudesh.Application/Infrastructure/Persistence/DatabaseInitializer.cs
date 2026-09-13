using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Cloudesh.Application.Infrastructure.Persistence;

/// <summary>
/// Brings the database to a usable state on startup, according to
/// <see cref="DatabaseOptions"/>.
/// </summary>
public sealed class DatabaseInitializer
{
    private readonly AppDbContext _dbContext;
    private readonly DatabaseSeeder _seeder;
    private readonly DatabaseOptions _options;
    private readonly DatabaseConnections _connections;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(
        AppDbContext dbContext,
        DatabaseSeeder seeder,
        IOptions<DatabaseOptions> options,
        DatabaseConnections connections,
        ILogger<DatabaseInitializer> logger)
    {
        _dbContext = dbContext;
        _seeder = seeder;
        _options = options.Value;
        _connections = connections;
        _logger = logger;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        if (_options.MigrateOnStartup)
        {
            if (!_dbContext.Database.GetMigrations().Any())
            {
                _logger.LogWarning(
                    "No migrations were found, so the schema cannot be created. Run " +
                    "`make migrate-add NAME=InitialCreate` to generate one.");
                return;
            }

            UseMigrationConnection();

            try
            {
                string[] pending = [.. await _dbContext.Database.GetPendingMigrationsAsync(cancellationToken)];

                if (pending.Length > 0)
                {
                    _logger.LogInformation("Applying {Count} pending migration(s): {Migrations}.",
                        pending.Length, string.Join(", ", pending));

                    await _dbContext.Database.MigrateAsync(cancellationToken);
                }
            }
            finally
            {
                RestoreRuntimeConnection();
            }
        }

        if (_options.SeedOnStartup)
        {
            await _seeder.SeedAsync(cancellationToken);
        }
    }

    private void UseMigrationConnection()
    {
        if (!string.Equals(_connections.Runtime, _connections.Migrations, StringComparison.Ordinal))
        {
            _dbContext.Database.SetConnectionString(_connections.Migrations);
        }
    }

    private void RestoreRuntimeConnection()
    {
        if (!string.Equals(_connections.Runtime, _connections.Migrations, StringComparison.Ordinal))
        {
            _dbContext.Database.SetConnectionString(_connections.Runtime);
        }
    }
}
