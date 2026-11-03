using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Zenvokra.Application.Infrastructure.Persistence;

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
        if (!_dbContext.Database.GetMigrations().Any())
        {
            throw new InvalidOperationException(
                "No EF Core migrations were found in the published assembly, so the " +
                "schema cannot be created. The image must include Zenvokra.Application.");
        }

        UseMigrationConnection();

        bool databaseWasEmpty;
        try
        {
            databaseWasEmpty = await DatabaseHasNoAppliedMigrationsAsync(cancellationToken);

            // A fresh Neon (or any empty Postgres) has no __EFMigrationsHistory.
            // Production appsettings leave MigrateOnStartup false so two replicas
            // do not race; that flag must not skip the first deploy.
            if (ShouldApplyMigrations(_options.MigrateOnStartup, databaseWasEmpty))
            {
                string[] pending = [.. await _dbContext.Database.GetPendingMigrationsAsync(cancellationToken)];

                if (pending.Length > 0)
                {
                    _logger.LogInformation("Applying {Count} pending migration(s): {Migrations}.",
                        pending.Length, string.Join(", ", pending));

                    await _dbContext.Database.MigrateAsync(cancellationToken);
                }
            }
        }
        finally
        {
            RestoreRuntimeConnection();
        }

        if (_options.SeedOnStartup || databaseWasEmpty)
        {
            await _seeder.SeedAsync(cancellationToken);
        }

        await EnsureUsersTableExistsAsync(cancellationToken);
    }

    internal static bool ShouldApplyMigrations(bool migrateOnStartup, bool databaseWasEmpty) =>
        migrateOnStartup || databaseWasEmpty;

    private async Task<bool> DatabaseHasNoAppliedMigrationsAsync(CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<string> applied =
                [.. await _dbContext.Database.GetAppliedMigrationsAsync(cancellationToken)];
            return applied.Count == 0;
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UndefinedTable)
        {
            return true;
        }
    }

    private async Task EnsureUsersTableExistsAsync(CancellationToken cancellationToken)
    {
        try
        {
            _ = await _dbContext.Users.AsNoTracking().AnyAsync(cancellationToken);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UndefinedTable)
        {
            throw new InvalidOperationException(
                "The database has no schema (relation \"users\" does not exist). " +
                "Startup must apply EF migrations before the API accepts traffic.",
                exception);
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
