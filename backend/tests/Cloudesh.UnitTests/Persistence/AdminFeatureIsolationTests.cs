using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Approvals;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Organization;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace Cloudesh.UnitTests.Persistence;

public sealed class AdminFeatureIsolationTests
{
    [Fact]
    public async Task Organization_profiles_are_invisible_to_other_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");

        using (fixture.TenantContext.BeginScope(globex))
        {
            fixture.DbContext.OrganizationProfiles.Add(OrganizationProfile.CreateAcme());
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

        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");

        using (fixture.TenantContext.BeginScope(globex))
        {
            Employee employee = Employee.Create("Not Yours", "EMP-9999", "nope@globex.test");
            fixture.DbContext.Employees.Add(employee);
            fixture.DbContext.PunchCorrections.Add(PunchCorrection.Create(
                employee.Id,
                EmployeeAppClock.Today,
                new TimeOnly(9, 42),
                new TimeOnly(9, 0),
                "Secret",
                EmployeeAppClock.NowUtc));
            await fixture.DbContext.SaveChangesAsync(cancellationToken);
        }

        fixture.DbContext.ChangeTracker.Clear();
        fixture.TenantContext.TenantId = acme;

        (await fixture.DbContext.PunchCorrections.AsNoTracking().ToListAsync(cancellationToken))
            .ShouldBeEmpty();
    }
}
