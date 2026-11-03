using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;
using Zenvokra.Application.Domain.Employees;
using Zenvokra.Application.Domain.Identity;

namespace Zenvokra.UnitTests.Persistence;

public sealed class EmployeeTenantIsolationTests
{
    [Fact]
    public async Task Employees_are_invisible_to_other_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");

        using (fixture.TenantContext.BeginScope(globex))
        {
            fixture.DbContext.Employees.Add(
                Employee.Create("Not Yours", "EMP-9999", "nope@globex.test"));
            await fixture.DbContext.SaveChangesAsync(cancellationToken);
        }

        fixture.DbContext.ChangeTracker.Clear();
        fixture.TenantContext.TenantId = acme;

        (await fixture.DbContext.Employees.AsNoTracking().ToListAsync(cancellationToken)).ShouldBeEmpty();
    }

    [Fact]
    public async Task Employee_accounts_are_invisible_to_other_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");

        using (fixture.TenantContext.BeginScope(globex))
        {
            var employee = Employee.Create("Not Yours", "EMP-9999", "nope@globex.test");
            fixture.DbContext.Employees.Add(employee);
            fixture.DbContext.EmployeeAccounts.Add(
                EmployeeAccount.Create(employee.Id, "nope@globex.test", "password1"));
            await fixture.DbContext.SaveChangesAsync(cancellationToken);
        }

        fixture.DbContext.ChangeTracker.Clear();
        fixture.TenantContext.TenantId = acme;

        (await fixture.DbContext.EmployeeAccounts.AsNoTracking().ToListAsync(cancellationToken))
            .ShouldBeEmpty();
    }
}
