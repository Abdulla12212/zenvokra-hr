using Cloudesh.Application.Domain.Tenants;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Persistence.Interceptors;
using Cloudesh.UnitTests.Tenancy;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.UnitTests.Persistence;

/// <summary>
/// A throwaway SQLite database plus the interceptors the real application uses.
/// </summary>
/// <remarks>
/// SQLite rather than the in-memory provider, because query filters, unique indexes,
/// and foreign keys need a database that actually enforces them. SQLite rather than
/// PostgreSQL, because these tests must run in milliseconds and without Docker;
/// anything that depends on PostgreSQL behaviour belongs in Cloudesh.IntegrationTests.
/// </remarks>
internal sealed class SqliteDbContextFixture : IAsyncDisposable
{
    private readonly SqliteConnection _connection;

    private SqliteDbContextFixture(SqliteConnection connection, FakeTenantContext tenantContext, AppDbContext dbContext)
    {
        _connection = connection;
        TenantContext = tenantContext;
        DbContext = dbContext;
    }

    public FakeTenantContext TenantContext { get; }

    public AppDbContext DbContext { get; }

    public static async Task<SqliteDbContextFixture> CreateAsync(Guid? tenantId = null, TimeProvider? timeProvider = null)
    {
        // A shared in-memory database lives as long as the connection is open.
        var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var tenantContext = new FakeTenantContext(tenantId);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .UseSnakeCaseNamingConvention()
            .AddInterceptors(
                new AuditableSaveChangesInterceptor(timeProvider ?? TimeProvider.System),
                new TenantSaveChangesInterceptor(tenantContext))
            .Options;

        var dbContext = new AppDbContext(options, tenantContext);
        await dbContext.Database.EnsureCreatedAsync();

        return new SqliteDbContextFixture(connection, tenantContext, dbContext);
    }

    /// <summary>
    /// Inserts a tenant row so that tenant-scoped inserts satisfy the foreign key.
    /// </summary>
    public async Task<Guid> AddTenantAsync(string slug)
    {
        var tenant = Tenant.Create(slug, slug);

        DbContext.Tenants.Add(tenant);
        await DbContext.SaveChangesAsync();

        return tenant.Id;
    }

    public async ValueTask DisposeAsync()
    {
        await DbContext.DisposeAsync();
        await _connection.DisposeAsync();
    }
}
