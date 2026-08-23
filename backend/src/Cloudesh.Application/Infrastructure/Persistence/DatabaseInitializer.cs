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
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(
        AppDbContext dbContext,
        DatabaseSeeder seeder,
        IOptions<DatabaseOptions> options,
        ILogger<DatabaseInitializer> logger)
    {
        _dbContext = dbContext;
        _seeder = seeder;
        _options = options.Value;
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

            string[] pending = [.. await _dbContext.Database.GetPendingMigrationsAsync(cancellationToken)];

            if (pending.Length > 0)
            {
                _logger.LogInformation("Applying {Count} pending migration(s): {Migrations}.",
                    pending.Length, string.Join(", ", pending));

                await _dbContext.Database.MigrateAsync(cancellationToken);
            }
        }

        if (_options.SeedOnStartup)
        {
            await _seeder.SeedAsync(cancellationToken);
        }
    }
}
