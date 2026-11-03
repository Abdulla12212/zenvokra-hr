using Zenvokra.Application.Domain.Approvals;
using Zenvokra.Application.Domain.Employees;
using Zenvokra.Application.Domain.Organization;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace Zenvokra.UnitTests.Persistence;

public sealed class AdminFeatureIsolationTests
{
    [Fact]
    public async Task Organization_profiles_are_invisible_to_other_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme-org");
        Guid globex = await fixture.AddTenantAsync("globex-org");

        using (fixture.TenantContext.BeginScope(globex))
        {
            fixture.DbContext.OrganizationProfiles.Add(
                OrganizationProfile.CreateDefaults("Globex", "globex-org"));
            await fixture.DbContext.SaveChangesAsync(cancellationToken);
        }

        fixture.DbContext.ChangeTracker.Clear();
        fixture.TenantContext.TenantId = acme;

        (await fixture.DbContext.OrganizationProfiles.AsNoTracking().ToListAsync(cancellationToken))
            .ShouldBeEmpty();
    }

    [Fact]
    public async Task Punch_corrections_are_invisible_to_other_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme-punch");
        Guid globex = await fixture.AddTenantAsync("globex-punch");

        using (fixture.TenantContext.BeginScope(globex))
        {
            Employee employee = Employee.Create("Not Yours", "EMP-9999", "nope@globex.test");
            fixture.DbContext.Employees.Add(employee);
            fixture.DbContext.PunchCorrections.Add(PunchCorrection.Create(
                employee.Id,
                new DateOnly(2026, 9, 13),
                new TimeOnly(9, 42),
                new TimeOnly(9, 0),
                "Secret",
                new DateTimeOffset(2026, 9, 13, 10, 0, 0, TimeSpan.Zero)));
            await fixture.DbContext.SaveChangesAsync(cancellationToken);
        }

        fixture.DbContext.ChangeTracker.Clear();
        fixture.TenantContext.TenantId = acme;

        (await fixture.DbContext.PunchCorrections.AsNoTracking().ToListAsync(cancellationToken))
            .ShouldBeEmpty();
    }
}
