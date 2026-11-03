using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;
using Zenvokra.Application.Domain.Identity;

namespace Zenvokra.UnitTests.Persistence;

/// <summary>
/// Covers <c>AuditableSaveChangesInterceptor</c>. <c>TenantAdmin</c> is only a stand-in
/// for "any auditable entity".
/// </summary>
public sealed class AuditingTests
{
    private static readonly DateTimeOffset Noon = new(2026, 8, 23, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Insert_stamps_both_timestamps()
    {
        var clock = new FixedTimeProvider(Noon);
        await using var fixture = await SqliteDbContextFixture.CreateAsync(timeProvider: clock);

        Guid tenantId = await fixture.AddTenantAsync("acme");
        fixture.TenantContext.TenantId = tenantId;

        var admin = TenantAdmin.Create("owner@acme.test", "password1");
        fixture.DbContext.TenantAdmins.Add(admin);
        await fixture.DbContext.SaveChangesAsync();

        admin.CreatedAtUtc.ShouldBe(Noon);
        admin.UpdatedAtUtc.ShouldBe(Noon);
    }

    [Fact]
    public async Task Update_moves_only_the_updated_timestamp()
    {
        var clock = new FixedTimeProvider(Noon);
        await using var fixture = await SqliteDbContextFixture.CreateAsync(timeProvider: clock);

        Guid tenantId = await fixture.AddTenantAsync("acme");
        fixture.TenantContext.TenantId = tenantId;

        var admin = TenantAdmin.Create("owner@acme.test", "password1");
        fixture.DbContext.TenantAdmins.Add(admin);
        await fixture.DbContext.SaveChangesAsync();

        clock.Advance(TimeSpan.FromHours(3));
        admin.Email = "renamed@acme.test";
        await fixture.DbContext.SaveChangesAsync();

        admin.CreatedAtUtc.ShouldBe(Noon);
        admin.UpdatedAtUtc.ShouldBe(Noon.AddHours(3));
    }

    [Fact]
    public async Task Created_timestamp_cannot_be_rewritten_by_an_update()
    {
        var clock = new FixedTimeProvider(Noon);
        await using var fixture = await SqliteDbContextFixture.CreateAsync(timeProvider: clock);

        Guid tenantId = await fixture.AddTenantAsync("acme");
        fixture.TenantContext.TenantId = tenantId;

        var admin = TenantAdmin.Create("owner@acme.test", "password1");
        fixture.DbContext.TenantAdmins.Add(admin);
        await fixture.DbContext.SaveChangesAsync();

        clock.Advance(TimeSpan.FromHours(3));
        admin.CreatedAtUtc = Noon.AddYears(-1);
        admin.Email = "renamed@acme.test";
        await fixture.DbContext.SaveChangesAsync();

        fixture.DbContext.ChangeTracker.Clear();

        TenantAdmin persisted = await fixture.DbContext.TenantAdmins.AsNoTracking().SingleAsync();
        persisted.CreatedAtUtc.ShouldBe(Noon);
    }
}
