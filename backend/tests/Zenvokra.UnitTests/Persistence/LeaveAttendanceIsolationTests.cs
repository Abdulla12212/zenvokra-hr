using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;
using Zenvokra.Application.Domain.Attendance;
using Zenvokra.Application.Domain.Employees;
using Zenvokra.Application.Domain.Holidays;
using Zenvokra.Application.Domain.Leave;

namespace Zenvokra.UnitTests.Persistence;

public sealed class LeaveAttendanceIsolationTests
{
    [Fact]
    public async Task Leave_requests_are_invisible_to_other_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme");
        Guid globex = await fixture.AddTenantAsync("globex");

        using (fixture.TenantContext.BeginScope(globex))
        {
            Employee employee = Employee.Create("Not Yours", "EMP-9999", "nope@globex.test");
            fixture.DbContext.Employees.Add(employee);
            fixture.DbContext.LeaveRequests.Add(LeaveRequest.Create(
                employee.Id,
                LeaveTypes.Annual,
                new DateOnly(2026, 8, 25),
                new DateOnly(2026, 8, 26),
                2,
                LeaveStatuses.Pending,
                "Someone",
                "Secret",
                new DateTimeOffset(2026, 8, 20, 9, 41, 0, TimeSpan.Zero)));
            await fixture.DbContext.SaveChangesAsync(cancellationToken);
        }

        fixture.DbContext.ChangeTracker.Clear();
        fixture.TenantContext.TenantId = acme;

        (await fixture.DbContext.LeaveRequests.AsNoTracking().ToListAsync(cancellationToken)).ShouldBeEmpty();
    }

    [Fact]
    public async Task Attendance_days_are_invisible_to_other_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme-att");
        Guid globex = await fixture.AddTenantAsync("globex-att");

        using (fixture.TenantContext.BeginScope(globex))
        {
            Employee employee = Employee.Create("Not Yours", "EMP-9999", "nope@globex.test");
            fixture.DbContext.Employees.Add(employee);
            fixture.DbContext.AttendanceDays.Add(AttendanceDay.Create(
                employee.Id,
                new DateOnly(2026, 8, 20),
                new TimeOnly(9, 42),
                new TimeOnly(18, 8),
                new TimeOnly(12, 15),
                new TimeOnly(13, 5),
                "Secret stamp"));
            await fixture.DbContext.SaveChangesAsync(cancellationToken);
        }

        fixture.DbContext.ChangeTracker.Clear();
        fixture.TenantContext.TenantId = acme;

        (await fixture.DbContext.AttendanceDays.AsNoTracking().ToListAsync(cancellationToken)).ShouldBeEmpty();
    }

    [Fact]
    public async Task Leave_allowances_are_invisible_to_other_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme-bal");
        Guid globex = await fixture.AddTenantAsync("globex-bal");

        using (fixture.TenantContext.BeginScope(globex))
        {
            Employee employee = Employee.Create("Not Yours", "EMP-9999", "nope@globex.test");
            fixture.DbContext.Employees.Add(employee);
            fixture.DbContext.LeaveAllowances.Add(LeaveAllowance.Create(employee.Id, LeaveTypes.Annual, 20, 0));
            await fixture.DbContext.SaveChangesAsync(cancellationToken);
        }

        fixture.DbContext.ChangeTracker.Clear();
        fixture.TenantContext.TenantId = acme;

        (await fixture.DbContext.LeaveAllowances.AsNoTracking().ToListAsync(cancellationToken)).ShouldBeEmpty();
    }

    [Fact]
    public async Task Company_holidays_are_invisible_to_other_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        await using var fixture = await SqliteDbContextFixture.CreateAsync();

        Guid acme = await fixture.AddTenantAsync("acme-hol");
        Guid globex = await fixture.AddTenantAsync("globex-hol");

        using (fixture.TenantContext.BeginScope(globex))
        {
            fixture.DbContext.CompanyHolidays.Add(
                CompanyHoliday.Create(new DateOnly(2026, 9, 5), "Globex Day", "Secret"));
            await fixture.DbContext.SaveChangesAsync(cancellationToken);
        }

        fixture.DbContext.ChangeTracker.Clear();
        fixture.TenantContext.TenantId = acme;

        (await fixture.DbContext.CompanyHolidays.AsNoTracking().ToListAsync(cancellationToken)).ShouldBeEmpty();
    }
}
