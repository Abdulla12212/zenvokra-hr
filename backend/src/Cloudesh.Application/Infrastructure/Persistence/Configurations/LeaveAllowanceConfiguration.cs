using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Domain.Tenants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cloudesh.Application.Infrastructure.Persistence.Configurations;

internal sealed class LeaveAllowanceConfiguration : IEntityTypeConfiguration<LeaveAllowance>
{
    public void Configure(EntityTypeBuilder<LeaveAllowance> builder)
    {
        builder.HasKey(allowance => allowance.Id);
        builder.Property(allowance => allowance.Id).ValueGeneratedNever();

        builder.Property(allowance => allowance.Type).HasMaxLength(32).IsRequired();

        builder.HasIndex(allowance => new { allowance.TenantId, allowance.EmployeeId, allowance.Type })
            .IsUnique();

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(allowance => allowance.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Employee>()
            .WithMany()
            .HasForeignKey(allowance => allowance.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
