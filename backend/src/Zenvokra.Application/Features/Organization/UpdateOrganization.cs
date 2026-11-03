using System.ComponentModel.DataAnnotations;
using Zenvokra.Application.Domain.Organization;
using Zenvokra.Application.Infrastructure.Persistence;
using Zenvokra.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Zenvokra.Application.Features.Organization;

public static class UpdateOrganization
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [StringLength(200, MinimumLength = 2)]
        public string DisplayName { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [EmailAddress]
        [StringLength(320)]
        public string WorkEmail { get; init; } = string.Empty;

        [StringLength(40)]
        public string SupportHotline { get; init; } = string.Empty;

        [StringLength(40)]
        public string OfficeLandline { get; init; } = string.Empty;

        [StringLength(320)]
        public string WebsiteUrl { get; init; } = string.Empty;

        [StringLength(120)]
        public string Industry { get; init; } = string.Empty;

        [StringLength(64)]
        public string FiscalYear { get; init; } = string.Empty;

        [StringLength(64)]
        public string WorkingDays { get; init; } = string.Empty;

        [StringLength(80)]
        public string ShiftTiming { get; init; } = string.Empty;

        [StringLength(400)]
        public string OfficeFloors { get; init; } = string.Empty;
    }

    public static async Task<Results<Ok<GetOrganization.Response>, NotFound>> HandleAsync(
        Request request,
        AppDbContext dbContext,
        ITenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        OrganizationProfile? profile = await OrganizationProfileStore.GetOrCreateAsync(
            dbContext,
            tenantContext,
            cancellationToken);

        if (profile is null)
        {
            return TypedResults.NotFound();
        }

        profile.DisplayName = request.DisplayName.Trim();
        profile.WorkEmail = request.WorkEmail.Trim();
        profile.SupportHotline = request.SupportHotline.Trim();
        profile.OfficeLandline = request.OfficeLandline.Trim();
        profile.WebsiteUrl = request.WebsiteUrl.Trim();
        profile.Industry = request.Industry.Trim();
        profile.FiscalYear = request.FiscalYear.Trim();
        profile.WorkingDays = request.WorkingDays.Trim();
        profile.ShiftTiming = request.ShiftTiming.Trim();
        profile.OfficeFloors = request.OfficeFloors.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(await GetOrganization.ToResponseAsync(dbContext, profile, cancellationToken));
    }
}
