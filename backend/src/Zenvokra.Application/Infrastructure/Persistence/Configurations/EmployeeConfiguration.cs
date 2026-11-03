using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zenvokra.Application.Domain.Employees;
using Zenvokra.Application.Domain.Tenants;

namespace Zenvokra.Application.Infrastructure.Persistence.Configurations;

internal sealed class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.HasKey(employee => employee.Id);
        builder.Property(employee => employee.Id).ValueGeneratedNever();

        builder.Property(employee => employee.FullName).HasMaxLength(200).IsRequired();
        builder.Property(employee => employee.EmployeeNumber).HasMaxLength(32).IsRequired();
        builder.Property(employee => employee.WorkEmail).HasMaxLength(320).IsRequired();
        builder.Property(employee => employee.Title).HasMaxLength(200).IsRequired();
        builder.Property(employee => employee.DepartmentName).HasMaxLength(200).IsRequired();
        builder.Property(employee => employee.Location).HasMaxLength(200).IsRequired();
        builder.Property(employee => employee.ManagerName).HasMaxLength(200).IsRequired();
        builder.Property(employee => employee.HoursLabel).HasMaxLength(32).IsRequired();
        builder.Property(employee => employee.WorkingDaysLabel).HasMaxLength(32).IsRequired();
        builder.Property(employee => employee.TimeZone).HasMaxLength(64).IsRequired();
        builder.Property(employee => employee.EmergencyContact).HasMaxLength(200).IsRequired();
        builder.Property(employee => employee.EmploymentType).HasMaxLength(32).IsRequired();
        builder.Property(employee => employee.Phone).HasMaxLength(40).IsRequired();
        builder.Property(employee => employee.TeamName).HasMaxLength(80).IsRequired();
        builder.Property(employee => employee.DeskLabel).HasMaxLength(120).IsRequired();
        builder.Property(employee => employee.Status).HasMaxLength(32).IsRequired();

        // Lead with TenantId: it matches how every query filters, and doubles as the
        // index EF would otherwise create for the tenant foreign key.
        builder.HasIndex(employee => new { employee.TenantId, employee.EmployeeNumber }).IsUnique();
        builder.HasIndex(employee => new { employee.TenantId, employee.WorkEmail }).IsUnique();

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(employee => employee.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
