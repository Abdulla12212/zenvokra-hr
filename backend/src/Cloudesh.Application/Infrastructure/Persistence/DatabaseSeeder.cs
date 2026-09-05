using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Departments;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Holidays;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Domain.Tenants;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Cloudesh.Application.Infrastructure.Persistence;

/// <summary>
/// Creates the demo tenant and some sample data so a fresh clone has something to
/// show. Idempotent: safe to run on every start.
/// </summary>
/// <remarks>
/// Real reference data that every tenant needs (leave types, holiday calendars,
/// countries) does not belong here — that is what migrations with
/// <c>HasData</c> or a dedicated reference-data migration are for. This seeder is
/// only for local convenience.
/// </remarks>
public sealed class DatabaseSeeder
{
    private static readonly string[] SampleDepartments = ["Engineering", "People Operations", "Finance"];

    private static readonly (int Day, int Hours, int Minutes)[] AugustWorkedHours =
    [
        (3, 8, 5),
        (4, 8, 12),
        (5, 7, 58),
        (6, 8, 0),
        (7, 8, 21),
        (10, 8, 4),
        (11, 8, 18),
        (13, 8, 2),
        (14, 8, 9),
        (17, 8, 6),
        (18, 8, 11),
    ];

    private readonly AppDbContext _dbContext;
    private readonly ITenantScopeFactory _tenantScopes;
    private readonly TenancyOptions _tenancyOptions;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        AppDbContext dbContext,
        ITenantScopeFactory tenantScopes,
        IOptions<TenancyOptions> tenancyOptions,
        ILogger<DatabaseSeeder> logger)
    {
        _dbContext = dbContext;
        _tenantScopes = tenantScopes;
        _tenancyOptions = tenancyOptions.Value;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (_tenancyOptions.DefaultTenantId is not Guid tenantId)
        {
            _logger.LogInformation(
                "Skipping seed: Tenancy:DefaultTenantId is not configured, so there is no tenant to seed into.");
            return;
        }

        await SeedTenantAsync(tenantId, cancellationToken);

        // Tenant-scoped rows run outside any request, so the tenant has to be
        // supplied explicitly for the query filter and the write interceptor.
        using (_tenantScopes.BeginScope(tenantId))
        {
            await SeedEmployeeAsync(cancellationToken);

            Guid? employeeId = await _dbContext.Employees
                .AsNoTracking()
                .Select(employee => (Guid?)employee.Id)
                .SingleOrDefaultAsync(cancellationToken);

            if (employeeId is Guid id)
            {
                await SeedHolidaysAsync(cancellationToken);
                await SeedLeaveAsync(id, cancellationToken);
                await SeedAttendanceAsync(id, cancellationToken);
            }

            await SeedDepartmentsAsync(cancellationToken);
        }
    }

    private async Task SeedTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        bool exists = await _dbContext.Tenants
            .AnyAsync(tenant => tenant.Id == tenantId, cancellationToken);

        if (exists)
        {
            return;
        }

        _dbContext.Tenants.Add(new Tenant
        {
            Id = tenantId,
            Name = "Acme Consulting",
            Slug = "acme-consulting",
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo tenant {TenantId}.", tenantId);
    }

    private async Task SeedEmployeeAsync(CancellationToken cancellationToken)
    {
        if (await _dbContext.Employees.AnyAsync(cancellationToken))
        {
            return;
        }

        _dbContext.Employees.Add(Employee.Create(
            "Akram Hossain",
            "EMP-1024",
            "akram.hossain@acmeconsulting.test"));

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo employee EMP-1024.");
    }

    private async Task SeedHolidaysAsync(CancellationToken cancellationToken)
    {
        if (await _dbContext.CompanyHolidays.AnyAsync(cancellationToken))
        {
            return;
        }

        _dbContext.CompanyHolidays.AddRange(
            CompanyHoliday.Create(
                new DateOnly(2026, 8, 15),
                "National Day",
                "Paid · not leave"),
            CompanyHoliday.Create(
                new DateOnly(2026, 9, 5),
                "Company Day",
                "Company Day · paid · not leave"));

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo closed days.");
    }

    private async Task SeedLeaveAsync(Guid employeeId, CancellationToken cancellationToken)
    {
        if (await _dbContext.LeaveAllowances.AnyAsync(cancellationToken))
        {
            return;
        }

        _dbContext.LeaveAllowances.AddRange(
            LeaveAllowance.Create(employeeId, LeaveTypes.Annual, totalDays: 20, openingUsedDays: 8),
            LeaveAllowance.Create(employeeId, LeaveTypes.Casual, totalDays: 10, openingUsedDays: 5),
            LeaveAllowance.Create(employeeId, LeaveTypes.Sick, totalDays: 10, openingUsedDays: 2));

        _dbContext.LeaveRequests.AddRange(
            LeaveRequest.Create(
                employeeId,
                LeaveTypes.Annual,
                new DateOnly(2026, 8, 25),
                new DateOnly(2026, 8, 26),
                days: 2,
                LeaveStatuses.Pending,
                "Nadia Chowdhury",
                "Family visit.",
                EmployeeAppClock.UtcFromDhaka(2026, 8, 20, 9, 41)),
            LeaveRequest.Create(
                employeeId,
                LeaveTypes.Sick,
                new DateOnly(2026, 8, 7),
                new DateOnly(2026, 8, 7),
                days: 1,
                LeaveStatuses.Approved,
                "Nadia Chowdhury",
                string.Empty,
                EmployeeAppClock.UtcFromDhaka(2026, 8, 6, 18, 2),
                EmployeeAppClock.UtcFromDhaka(2026, 8, 6, 18, 30)),
            LeaveRequest.Create(
                employeeId,
                LeaveTypes.Casual,
                new DateOnly(2026, 7, 29),
                new DateOnly(2026, 7, 29),
                days: 1,
                LeaveStatuses.Rejected,
                "Nadia Chowdhury",
                string.Empty,
                EmployeeAppClock.UtcFromDhaka(2026, 7, 28, 11, 14),
                EmployeeAppClock.UtcFromDhaka(2026, 7, 28, 16, 0)));

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo leave balances and requests.");
    }

    private async Task SeedAttendanceAsync(Guid employeeId, CancellationToken cancellationToken)
    {
        if (await _dbContext.AttendanceDays.AnyAsync(cancellationToken))
        {
            return;
        }

        var days = new List<AttendanceDay>(AugustWorkedHours.Length + 3);

        foreach ((int day, int hours, int minutes) in AugustWorkedHours)
        {
            days.Add(WorkedDay(
                employeeId,
                new DateOnly(2026, 8, day),
                new TimeOnly(9, 0),
                TimeSpan.FromHours(hours) + TimeSpan.FromMinutes(minutes)));
        }

        days.Add(WorkedDay(
            employeeId,
            new DateOnly(2026, 8, 12),
            new TimeOnly(9, 35),
            TimeSpan.FromHours(8) + TimeSpan.FromMinutes(5)));

        days.Add(AttendanceDay.Create(
            employeeId,
            new DateOnly(2026, 8, 19),
            new TimeOnly(9, 42),
            new TimeOnly(18, 8),
            new TimeOnly(12, 15),
            new TimeOnly(13, 5),
            "In was 09:00. Punch missed."));

        days.Add(AttendanceDay.Create(
            employeeId,
            EmployeeAppClock.Today,
            new TimeOnly(9, 2),
            clockOut: null,
            new TimeOnly(12, 15),
            new TimeOnly(13, 5),
            note: string.Empty));

        _dbContext.AttendanceDays.AddRange(days);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo attendance stamps.");
    }

    private static AttendanceDay WorkedDay(
        Guid employeeId,
        DateOnly date,
        TimeOnly clockIn,
        TimeSpan worked)
    {
        TimeOnly breakStart = new(12, 15);
        TimeOnly breakEnd = new(13, 5);
        TimeSpan breakLength = breakEnd - breakStart;
        TimeOnly clockOut = clockIn.Add(worked + breakLength);

        return AttendanceDay.Create(employeeId, date, clockIn, clockOut, breakStart, breakEnd, string.Empty);
    }

    // WALKING SKELETON: delete alongside the Departments feature.
    private async Task SeedDepartmentsAsync(CancellationToken cancellationToken)
    {
        if (await _dbContext.Departments.AnyAsync(cancellationToken))
        {
            return;
        }

        _dbContext.Departments.AddRange(SampleDepartments.Select(Department.Create));

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded {Count} sample departments.", SampleDepartments.Length);
    }
}
