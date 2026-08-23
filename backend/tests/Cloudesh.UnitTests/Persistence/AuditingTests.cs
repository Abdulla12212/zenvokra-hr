using Cloudesh.Application.Domain.Departments;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace Cloudesh.UnitTests.Persistence;

/// <summary>
/// Covers <c>AuditableSaveChangesInterceptor</c>. <c>Department</c> is only a stand-in
/// for "any auditable entity"; when the walking skeleton is deleted, keep these tests and
/// point them at a real entity.
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

        var department = Department.Create("Engineering");
        fixture.DbContext.Departments.Add(department);
        await fixture.DbContext.SaveChangesAsync();

        department.CreatedAtUtc.ShouldBe(Noon);
        department.UpdatedAtUtc.ShouldBe(Noon);
    }

    [Fact]
    public async Task Update_moves_only_the_updated_timestamp()
    {
        var clock = new FixedTimeProvider(Noon);
        await using var fixture = await SqliteDbContextFixture.CreateAsync(timeProvider: clock);

        Guid tenantId = await fixture.AddTenantAsync("acme");
        fixture.TenantContext.TenantId = tenantId;

        var department = Department.Create("Engineering");
        fixture.DbContext.Departments.Add(department);
        await fixture.DbContext.SaveChangesAsync();

        clock.Advance(TimeSpan.FromHours(3));
        department.Name = "Platform Engineering";
        await fixture.DbContext.SaveChangesAsync();

        department.CreatedAtUtc.ShouldBe(Noon);
        department.UpdatedAtUtc.ShouldBe(Noon.AddHours(3));
    }

    [Fact]
    public async Task Created_timestamp_cannot_be_rewritten_by_an_update()
    {
        var clock = new FixedTimeProvider(Noon);
        await using var fixture = await SqliteDbContextFixture.CreateAsync(timeProvider: clock);

        Guid tenantId = await fixture.AddTenantAsync("acme");
        fixture.TenantContext.TenantId = tenantId;

        var department = Department.Create("Engineering");
        fixture.DbContext.Departments.Add(department);
        await fixture.DbContext.SaveChangesAsync();

        clock.Advance(TimeSpan.FromHours(3));
        department.CreatedAtUtc = Noon.AddYears(-1);
        department.Name = "Platform Engineering";
        await fixture.DbContext.SaveChangesAsync();

        fixture.DbContext.ChangeTracker.Clear();

        Department persisted = await fixture.DbContext.Departments.AsNoTracking().SingleAsync();
        persisted.CreatedAtUtc.ShouldBe(Noon);
    }
}
