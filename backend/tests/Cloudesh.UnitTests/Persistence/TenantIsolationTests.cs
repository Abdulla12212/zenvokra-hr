using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace Cloudesh.UnitTests.Persistence;

/// <summary>
/// The most important tests in the repository: if tenant isolation breaks, one
/// customer sees another customer's HR data.
/// </summary>
/// <remarks>
/// These test the tenancy mechanism, not tenant admins — <c>TenantAdmin</c> is the
/// stand-in for "any tenant-scoped entity".
/// </remarks>
public sealed class TenantIsolationTests
{
    [Fact]
    public async Task Queries_return_only_the_current_tenants_rows()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");

        await AddAdminAsync(fixture, acme, "owner@acme.test");
        await AddAdminAsync(fixture, globex, "owner@globex.test");
        await AddAdminAsync(fixture, globex, "hr@globex.test");

        fixture.TenantContext.TenantId = acme;

        var visible = await fixture.DbContext.TenantAdmins.AsNoTracking().ToListAsync();

        visible.Count.ShouldBe(1);
        visible[0].Email.ShouldBe("owner@acme.test");
        visible[0].TenantId.ShouldBe(acme);
    }

    [Fact]
    public async Task Queries_return_nothing_when_no_tenant_is_resolved()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme");
        await AddAdminAsync(fixture, acme, "owner@acme.test");

        fixture.TenantContext.TenantId = null;

        var visible = await fixture.DbContext.TenantAdmins.AsNoTracking().ToListAsync();

        // Failing closed matters: an unresolved tenant must never mean "all tenants".
        visible.ShouldBeEmpty();
    }

    [Fact]
    public async Task Ignoring_the_tenant_filter_by_name_crosses_tenants()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");
        await AddAdminAsync(fixture, acme, "owner@acme.test");
        await AddAdminAsync(fixture, globex, "owner@globex.test");

        fixture.TenantContext.TenantId = acme;

        // The deliberate, reviewable way to escape isolation: name the filter, so a
        // reader can see exactly which guarantee was given up.
        var visible = await fixture.DbContext.TenantAdmins
            .IgnoreQueryFilters([AppDbContext.TenantIsolationFilter])
            .AsNoTracking()
            .ToListAsync();

        visible.Count.ShouldBe(2);
    }

    [Fact]
    public async Task Ignoring_all_filters_crosses_tenants_which_is_why_it_needs_care()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");
        await AddAdminAsync(fixture, acme, "owner@acme.test");
        await AddAdminAsync(fixture, globex, "owner@globex.test");

        fixture.TenantContext.TenantId = acme;

        var visible = await fixture.DbContext.TenantAdmins
            .IgnoreQueryFilters()
            .AsNoTracking()
            .ToListAsync();

        // Documents the sharp edge rather than endorsing it: bare IgnoreQueryFilters()
        // silently removes tenant isolation along with everything else. Once a second
        // named filter exists, this call should always name the one it means.
        visible.Count.ShouldBe(2);
    }

    [Fact]
    public async Task Insert_gets_stamped_with_the_current_tenant()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();
        Guid acme = await fixture.AddTenantAsync("acme");
        fixture.TenantContext.TenantId = acme;

        var admin = TenantAdmin.Create("owner@acme.test", "password1");
        admin.TenantId.ShouldBe(Guid.Empty);

        fixture.DbContext.TenantAdmins.Add(admin);
        await fixture.DbContext.SaveChangesAsync();

        admin.TenantId.ShouldBe(acme);
    }

    [Fact]
    public async Task Insert_is_refused_when_no_tenant_is_resolved()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();
        await fixture.AddTenantAsync("acme");

        fixture.TenantContext.TenantId = null;
        fixture.DbContext.TenantAdmins.Add(TenantAdmin.Create("owner@acme.test", "password1"));

        await Should.ThrowAsync<TenantNotResolvedException>(
            () => fixture.DbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task Insert_naming_another_tenant_is_refused()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();
        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");

        fixture.TenantContext.TenantId = acme;

        var admin = TenantAdmin.Create("owner@globex.test", "password1");
        admin.TenantId = globex;
        fixture.DbContext.TenantAdmins.Add(admin);

        await Should.ThrowAsync<CrossTenantOperationException>(
            () => fixture.DbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task Update_of_another_tenants_row_is_refused()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();
        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");
        await AddAdminAsync(fixture, globex, "owner@globex.test");

        // Read as Globex, then act as Acme: this is what a leaked primary key looks
        // like, and the query filter alone would not stop the write.
        fixture.TenantContext.TenantId = globex;
        TenantAdmin victim = await fixture.DbContext.TenantAdmins.SingleAsync();

        fixture.TenantContext.TenantId = acme;
        victim.Email = "stolen@acme.test";

        await Should.ThrowAsync<CrossTenantOperationException>(
            () => fixture.DbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task Reassigning_a_row_to_the_current_tenant_is_refused()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();
        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");
        await AddAdminAsync(fixture, globex, "owner@globex.test");

        fixture.TenantContext.TenantId = acme;

        // Rewriting TenantId to the current tenant would pass an ownership check that
        // only compared the new value, so the interceptor also refuses any change to
        // TenantId at all.
        TenantAdmin stolen = await fixture.DbContext.TenantAdmins.IgnoreQueryFilters().SingleAsync();
        stolen.TenantId = acme;

        await Should.ThrowAsync<CrossTenantOperationException>(
            () => fixture.DbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task Delete_of_another_tenants_row_is_refused()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();
        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");
        await AddAdminAsync(fixture, globex, "owner@globex.test");

        fixture.TenantContext.TenantId = globex;
        TenantAdmin victim = await fixture.DbContext.TenantAdmins.SingleAsync();

        fixture.TenantContext.TenantId = acme;
        fixture.DbContext.TenantAdmins.Remove(victim);

        await Should.ThrowAsync<CrossTenantOperationException>(
            () => fixture.DbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task Two_tenants_can_each_have_an_admin()
    {
        await using var fixture = await SqliteDbContextFixture.CreateAsync();
        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");

        await AddAdminAsync(fixture, acme, "owner@acme.test");
        await AddAdminAsync(fixture, globex, "owner@globex.test");

        int total = await fixture.DbContext.TenantAdmins.IgnoreQueryFilters().CountAsync();
        total.ShouldBe(2);
    }

    private static async Task AddAdminAsync(SqliteDbContextFixture fixture, Guid tenantId, string email)
    {
        using (fixture.TenantContext.BeginScope(tenantId))
        {
            fixture.DbContext.TenantAdmins.Add(TenantAdmin.Create(email, "password1"));
            await fixture.DbContext.SaveChangesAsync();
        }

        // Stop the change tracker from carrying entities between tenant switches.
        fixture.DbContext.ChangeTracker.Clear();
    }
}
