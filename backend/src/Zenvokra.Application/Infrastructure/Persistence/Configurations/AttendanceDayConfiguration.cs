using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zenvokra.Application.Domain.Attendance;
using Zenvokra.Application.Domain.Employees;
using Zenvokra.Application.Domain.Tenants;

namespace Zenvokra.Application.Infrastructure.Persistence.Configurations;

internal sealed class AttendanceDayConfiguration : IEntityTypeConfiguration<AttendanceDay>
{
    public void Configure(EntityTypeBuilder<AttendanceDay> builder)
    {
        builder.HasKey(day => day.Id);
        builder.Property(day => day.Id).ValueGeneratedNever();

        builder.Property(day => day.Note).HasMaxLength(400).IsRequired();
        builder.Property(day => day.PriorWorked)
            .HasDefaultValue(TimeSpan.Zero)
            .ValueGeneratedNever();

        builder.HasIndex(day => new { day.TenantId, day.EmployeeId, day.Date }).IsUnique();

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(day => day.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Employee>()
            .WithMany()
            .HasForeignKey(day => day.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
