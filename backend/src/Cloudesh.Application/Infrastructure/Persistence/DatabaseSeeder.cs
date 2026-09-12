using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Infrastructure.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Cloudesh.Application.Infrastructure.Persistence;

/// <summary>
/// Upserts the configured platform admin so a fresh clone can sign in.
/// Idempotent: safe to run on every start.
/// </summary>
public sealed class DatabaseSeeder
{
    private readonly AppDbContext _dbContext;
    private readonly PlatformAdminOptions _platformAdmin;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        AppDbContext dbContext,
        IOptions<PlatformAdminOptions> platformAdmin,
        ILogger<DatabaseSeeder> logger)
    {
        _dbContext = dbContext;
        _platformAdmin = platformAdmin.Value;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (!_platformAdmin.IsConfigured)
        {
            _logger.LogInformation(
                "Skipping seed: PlatformAdmin:Email and PlatformAdmin:Password are not both configured.");
            return;
        }

        await SeedPlatformAdminAsync(cancellationToken);
    }

    private async Task SeedPlatformAdminAsync(CancellationToken cancellationToken)
    {
        string email = LoginEmail.Normalize(_platformAdmin.Email);
        string password = _platformAdmin.Password;

        User? existing = await _dbContext.Users
            .SingleOrDefaultAsync(user => user.Role == UserRoles.PlatformAdmin, cancellationToken);

        if (existing is null)
        {
            _dbContext.Users.Add(User.CreatePlatformAdmin(email, password));
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Seeded platform admin {Email}.", email);
            return;
        }

        existing.Email = email;
        existing.Password = password;
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated seeded platform admin {Email}.", email);
    }
}
