using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Organization;

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
        CancellationToken cancellationToken)
    {
        var profile = await dbContext.OrganizationProfiles
            .AsNoTracking()
            .Select(row => new
            {
                row.Id,
                row.DisplayName,
                row.WorkEmail,
                row.SupportHotline,
                row.OfficeLandline,
                row.WebsiteUrl,
                row.Industry,
                row.FiscalYear,
                row.WorkingDays,
                row.ShiftTiming,
                row.OfficeFloors,
                row.LegalName,
                row.ClientCode,
                row.SubscriptionTier,
                row.ContractPeriod,
                row.SeatLimit,
                row.RegionTimeZone,
                row.SupportSla,
                row.RegisteredOffice,
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (profile is null)
        {
            return TypedResults.NotFound();
        }

        int activeSeats = await dbContext.Employees.AsNoTracking().CountAsync(cancellationToken);

        return TypedResults.Ok(new Response(
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
            profile.RegisteredOffice));
    }
}
