using Zenvokra.Application.Domain.Organization;
using Zenvokra.Application.Infrastructure.Persistence;
using Zenvokra.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Zenvokra.Application.Features.Organization;

public static class GetOrganization
{
    public sealed record Response(
        Guid Id,
        string DisplayName,
        string WorkEmail,
        string SupportHotline,
        string OfficeLandline,
        string WebsiteUrl,
        string Industry,
        string FiscalYear,
        string WorkingDays,
        string ShiftTiming,
        string OfficeFloors,
        string LegalName,
        string ClientCode,
        string SubscriptionTier,
        string ContractPeriod,
        int SeatLimit,
        int ActiveSeats,
        string RegionTimeZone,
        string SupportSla,
        string RegisteredOffice);

    public static async Task<Results<Ok<Response>, NotFound>> HandleAsync(
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

        EntityEntry<OrganizationProfile> entry = dbContext.Entry(profile);

        if (entry.State == EntityState.Added)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return TypedResults.Ok(await ToResponseAsync(dbContext, profile, cancellationToken));
    }

    internal static async Task<Response> ToResponseAsync(
        AppDbContext dbContext,
        OrganizationProfile profile,
        CancellationToken cancellationToken)
    {
        int activeSeats = await dbContext.Employees.AsNoTracking().CountAsync(cancellationToken);

        return new Response(
            profile.Id,
            profile.DisplayName,
            profile.WorkEmail,
            profile.SupportHotline,
            profile.OfficeLandline,
            profile.WebsiteUrl,
            profile.Industry,
            profile.FiscalYear,
            profile.WorkingDays,
            profile.ShiftTiming,
            profile.OfficeFloors,
            profile.LegalName,
            profile.ClientCode,
            profile.SubscriptionTier,
            profile.ContractPeriod,
            profile.SeatLimit,
            activeSeats,
            profile.RegionTimeZone,
            profile.SupportSla,
            profile.RegisteredOffice);
    }
}
