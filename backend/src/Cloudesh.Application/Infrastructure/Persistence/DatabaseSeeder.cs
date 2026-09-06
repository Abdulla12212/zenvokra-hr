using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Approvals;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Departments;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Holidays;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Domain.Organization;
using Cloudesh.Application.Domain.Tenants;
using Cloudesh.Application.Features.Employees;
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
            await SeedRosterAsync(cancellationToken);
            await SeedOrganizationAsync(cancellationToken);

            Guid? employeeId = await _dbContext.Employees
                .AsNoTracking()
                .Where(employee => employee.EmployeeNumber == CurrentEmployee.DemoEmployeeNumber)
                .Select(employee => (Guid?)employee.Id)
                .SingleOrDefaultAsync(cancellationToken);

            if (employeeId is Guid id)
            {
                await SeedHolidaysAsync(cancellationToken);
                await SeedLeaveAsync(id, cancellationToken);
                await EnsureAkramPendingLeaveAsync(id, cancellationToken);
                await SeedAttendanceAsync(id, cancellationToken);
                await SeedPunchCorrectionAsync(id, cancellationToken);
            }

            await SeedRosterAllowancesAsync(cancellationToken);
            await SeedRosterTodayAsync(cancellationToken);
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

        Employee akram = Employee.Create(
            "Akram Hossain",
            CurrentEmployee.DemoEmployeeNumber,
            "akram.hossain@acmeconsulting.test");
        akram.IsAdmin = true;
        akram.Phone = "+880 1711-102400";
        akram.DeskLabel = "Floor 4, Desk 4B-12";
        akram.TeamName = "Platform Team";

        _dbContext.Employees.Add(akram);

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo employee EMP-1024.");
    }

    private async Task SeedRosterAsync(CancellationToken cancellationToken)
    {
        HashSet<string> existing = [.. await _dbContext.Employees
            .AsNoTracking()
            .Select(employee => employee.EmployeeNumber)
            .ToListAsync(cancellationToken)];

        Employee? akram = await _dbContext.Employees
            .SingleOrDefaultAsync(
                employee => employee.EmployeeNumber == CurrentEmployee.DemoEmployeeNumber,
                cancellationToken);

        if (akram is not null && !akram.IsAdmin)
        {
            akram.IsAdmin = true;
            akram.Phone = string.IsNullOrWhiteSpace(akram.Phone) ? "+880 1711-102400" : akram.Phone;
            akram.DeskLabel = string.IsNullOrWhiteSpace(akram.DeskLabel) ? "Floor 4, Desk 4B-12" : akram.DeskLabel;
        }

        List<Employee> extras = [];

        foreach ((string number, Action<Employee> configure) in Roster())
        {
            if (existing.Contains(number))
            {
                continue;
            }

            Employee row = Employee.Create("Pending", number, $"{number.ToLowerInvariant()}@acmeconsulting.test");
            configure(row);
            extras.Add(row);
        }

        if (extras.Count > 0)
        {
            _dbContext.Employees.AddRange(extras);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        Employee? nadia = await _dbContext.Employees
            .AsNoTracking()
            .SingleOrDefaultAsync(employee => employee.EmployeeNumber == "EMP-1001", cancellationToken);

        if (nadia is not null
            && !await _dbContext.LeaveRequests.AnyAsync(
                request => request.EmployeeId == nadia.Id,
                cancellationToken))
        {
            _dbContext.LeaveRequests.Add(LeaveRequest.Create(
                nadia.Id,
                LeaveTypes.Annual,
                new DateOnly(2026, 8, 25),
                new DateOnly(2026, 8, 26),
                days: 2,
                LeaveStatuses.Pending,
                "Akram Hossain",
                "Family visit.",
                EmployeeAppClock.UtcFromDhaka(2026, 8, 20, 9, 10)));
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        Employee? farhana = await _dbContext.Employees
            .AsNoTracking()
            .SingleOrDefaultAsync(employee => employee.EmployeeNumber == "EMP-1042", cancellationToken);

        if (farhana is not null
            && !await _dbContext.LeaveRequests.AnyAsync(
                request => request.EmployeeId == farhana.Id,
                cancellationToken))
        {
            _dbContext.LeaveRequests.Add(LeaveRequest.Create(
                farhana.Id,
                LeaveTypes.Sick,
                EmployeeAppClock.Today,
                EmployeeAppClock.Today,
                days: 1,
                LeaveStatuses.Approved,
                "Nadia Chowdhury",
                "Fever.",
                EmployeeAppClock.UtcFromDhaka(2026, 8, 19, 16, 20),
                EmployeeAppClock.UtcFromDhaka(2026, 8, 19, 17, 5)));
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        if (extras.Count > 0)
        {
            _logger.LogInformation("Seeded {Count} additional employees.", extras.Count);
        }
    }

    private static (string Number, Action<Employee> Configure)[] Roster() =>
    [
        ("EMP-1001", employee =>
        {
            employee.FullName = "Nadia Chowdhury";
            employee.WorkEmail = "nadia.chowdhury@acmeconsulting.test";
            employee.Title = "VP of Engineering";
            employee.DepartmentName = "Engineering";
            employee.TeamName = "Leadership";
            employee.Location = "Dhaka HQ";
            employee.DeskLabel = "Floor 5";
            employee.ManagerName = string.Empty;
            employee.Phone = "+880 1711-100100";
            employee.StartedOn = new DateOnly(2022, 3, 1);
        }),
        ("EMP-1031", employee =>
        {
            employee.FullName = "Samira Khan";
            employee.WorkEmail = "samira.khan@acmeconsulting.test";
            employee.Title = "Workplace Ops";
            employee.DepartmentName = "Operations";
            employee.TeamName = "Workplace";
            employee.Location = "Dhaka HQ";
            employee.DeskLabel = "Ground";
            employee.ManagerName = "Nadia Chowdhury";
            employee.Phone = "+880 1711-103100";
            employee.Status = EmployeeStatuses.Remote;
            employee.StartedOn = new DateOnly(2023, 6, 12);
        }),
        ("EMP-1038", employee =>
        {
            employee.FullName = "Tanvir Ahmed";
            employee.WorkEmail = "tanvir.ahmed@acmeconsulting.test";
            employee.Title = "DevOps Specialist";
            employee.DepartmentName = "Engineering";
            employee.TeamName = "Platform";
            employee.Location = "Remote / Hybrid";
            employee.DeskLabel = "Remote";
            employee.ManagerName = "Nadia Chowdhury";
            employee.Phone = "+880 1711-103800";
            employee.Status = EmployeeStatuses.Probation;
            employee.StartedOn = new DateOnly(2026, 5, 4);
        }),
        ("EMP-1040", employee =>
        {
            employee.FullName = "Tariq Ahmed";
            employee.WorkEmail = "tariq.ahmed@acmeconsulting.test";
            employee.Title = "Software Engineer";
            employee.DepartmentName = "Engineering";
            employee.Location = "Dhaka HQ";
            employee.DeskLabel = "Floor 4";
            employee.ManagerName = "Nadia Chowdhury";
            employee.Phone = "+880 1711-104000";
            employee.StartedOn = new DateOnly(2024, 8, 1);
        }),
        ("EMP-1042", employee =>
        {
            employee.FullName = "Farhana Yasmin";
            employee.WorkEmail = "farhana.yasmin@acmeconsulting.test";
            employee.Title = "Product Designer";
            employee.DepartmentName = "Design & Product";
            employee.TeamName = "Design";
            employee.Location = "Dhaka HQ";
            employee.DeskLabel = "Floor 4";
            employee.ManagerName = "Nadia Chowdhury";
            employee.Phone = "+880 1711-104200";
            employee.StartedOn = new DateOnly(2025, 1, 15);
        }),
        ("EMP-1044", employee =>
        {
            employee.FullName = "Zubair Malik";
            employee.WorkEmail = "zubair.malik@acmeconsulting.test";
            employee.Title = "Finance Analyst";
            employee.DepartmentName = "Operations";
            employee.TeamName = "Finance";
            employee.Location = "Dhaka HQ";
            employee.DeskLabel = "Floor 5";
            employee.ManagerName = "Nadia Chowdhury";
            employee.Phone = "+880 1711-104400";
            employee.StartedOn = new DateOnly(2023, 11, 20);
        }),
    ];

    private async Task SeedOrganizationAsync(CancellationToken cancellationToken)
    {
        if (await _dbContext.OrganizationProfiles.AnyAsync(cancellationToken))
        {
            return;
        }

        _dbContext.OrganizationProfiles.Add(OrganizationProfile.CreateAcme());
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded organization profile for Acme Consulting.");
    }

    private async Task SeedPunchCorrectionAsync(Guid employeeId, CancellationToken cancellationToken)
    {
        if (await _dbContext.PunchCorrections.AnyAsync(cancellationToken))
        {
            return;
        }

        _dbContext.PunchCorrections.Add(PunchCorrection.Create(
            employeeId,
            new DateOnly(2026, 8, 20),
            new TimeOnly(9, 42),
            new TimeOnly(9, 0),
            "Punch missed due to a biometric scanner reboot on Floor 4. In was 09:00.",
            EmployeeAppClock.UtcFromDhaka(2026, 8, 20, 9, 44),
            managerVerified: true));

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo punch correction.");
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

    private async Task EnsureAkramPendingLeaveAsync(Guid employeeId, CancellationToken cancellationToken)
    {
        bool exists = await _dbContext.LeaveRequests.AnyAsync(
            request =>
                request.EmployeeId == employeeId
                && request.StartDate == new DateOnly(2026, 8, 25)
                && request.Status == LeaveStatuses.Pending,
            cancellationToken);

        if (exists)
        {
            return;
        }

        _dbContext.LeaveRequests.Add(LeaveRequest.Create(
            employeeId,
            LeaveTypes.Annual,
            new DateOnly(2026, 8, 25),
            new DateOnly(2026, 8, 26),
            days: 2,
            LeaveStatuses.Pending,
            "Nadia Chowdhury",
            "Family visit.",
            EmployeeAppClock.UtcFromDhaka(2026, 8, 20, 9, 41)));
        await _dbContext.SaveChangesAsync(cancellationToken);
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

    private async Task SeedRosterAllowancesAsync(CancellationToken cancellationToken)
    {
        List<Guid> employeeIds = await _dbContext.Employees
            .AsNoTracking()
            .Select(employee => employee.Id)
            .ToListAsync(cancellationToken);

        HashSet<Guid> withAllowances = [.. await _dbContext.LeaveAllowances
            .AsNoTracking()
            .Select(allowance => allowance.EmployeeId)
            .Distinct()
            .ToListAsync(cancellationToken)];

        List<LeaveAllowance> extras = [];

        foreach (Guid employeeId in employeeIds)
        {
            if (withAllowances.Contains(employeeId))
            {
                continue;
            }

            extras.Add(LeaveAllowance.Create(employeeId, LeaveTypes.Annual, totalDays: 20, openingUsedDays: 0));
            extras.Add(LeaveAllowance.Create(employeeId, LeaveTypes.Casual, totalDays: 10, openingUsedDays: 0));
            extras.Add(LeaveAllowance.Create(employeeId, LeaveTypes.Sick, totalDays: 10, openingUsedDays: 0));
        }

        if (extras.Count == 0)
        {
            return;
        }

        _dbContext.LeaveAllowances.AddRange(extras);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedRosterTodayAsync(CancellationToken cancellationToken)
    {
        DateOnly today = EmployeeAppClock.Today;
        List<Employee> employees = await _dbContext.Employees
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        HashSet<Guid> stamped = [.. await _dbContext.AttendanceDays
            .AsNoTracking()
            .Where(day => day.Date == today)
            .Select(day => day.EmployeeId)
            .ToListAsync(cancellationToken)];

        List<AttendanceDay> extras = [];

        foreach (Employee employee in employees)
        {
            if (stamped.Contains(employee.Id))
            {
                continue;
            }

            AttendanceDay? day = TodayStampFor(employee.Id, employee.EmployeeNumber, today);
            if (day is not null)
            {
                extras.Add(day);
            }
        }

        if (extras.Count == 0)
        {
            return;
        }

        _dbContext.AttendanceDays.AddRange(extras);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded {Count} roster stamps for today.", extras.Count);
    }

    private static AttendanceDay? TodayStampFor(Guid employeeId, string employeeNumber, DateOnly today) =>
        employeeNumber switch
        {
            "EMP-1001" => AttendanceDay.Create(
                employeeId,
                today,
                new TimeOnly(8, 58),
                clockOut: null,
                new TimeOnly(12, 15),
                new TimeOnly(13, 5),
                note: string.Empty),
            "EMP-1031" => AttendanceDay.Create(
                employeeId,
                today,
                new TimeOnly(9, 0),
                clockOut: null,
                new TimeOnly(13, 15),
                breakEnd: null,
                note: string.Empty,
                onBreak: true),
            "EMP-1038" => AttendanceDay.Create(
                employeeId,
                today,
                new TimeOnly(9, 10),
                new TimeOnly(17, 30),
                new TimeOnly(12, 15),
                new TimeOnly(13, 5),
                note: string.Empty),
            "EMP-1040" => AttendanceDay.Create(
                employeeId,
                today,
                new TimeOnly(9, 40),
                clockOut: null,
                new TimeOnly(12, 15),
                new TimeOnly(13, 5),
                note: string.Empty),
            "EMP-1044" => AttendanceDay.Create(
                employeeId,
                today,
                new TimeOnly(9, 5),
                clockOut: null,
                new TimeOnly(12, 15),
                new TimeOnly(13, 5),
                note: string.Empty),
            _ => null,
        };

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
