using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Domain.Tenants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cloudesh.Application.Infrastructure.Persistence.Configurations;

internal sealed class LeaveRequestConfiguration : IEntityTypeConfiguration<LeaveRequest>
{
    public void Configure(EntityTypeBuilder<LeaveRequest> builder)
    {
        builder.HasKey(request => request.Id);
        builder.Property(request => request.Id).ValueGeneratedNever();

        builder.Property(request => request.Type).HasMaxLength(32).IsRequired();
        builder.Property(request => request.Status).HasMaxLength(32).IsRequired();
        builder.Property(request => request.ApproverName).HasMaxLength(200).IsRequired();
        builder.Property(request => request.Note).HasMaxLength(400).IsRequired();
        builder.Property(request => request.DecisionNote).HasMaxLength(400).IsRequired();

        builder.HasIndex(request => new { request.TenantId, request.EmployeeId, request.StartDate });

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(request => request.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Employee>()
            .WithMany()
            .HasForeignKey(request => request.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
