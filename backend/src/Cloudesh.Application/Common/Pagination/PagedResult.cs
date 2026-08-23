namespace Cloudesh.Application.Common.Pagination;

/// <summary>
/// Envelope for every list endpoint, so clients can rely on one shape.
/// </summary>
/// <remarks>
/// Offset pagination is fine for the collection sizes an HR tool for small
/// companies produces. Switch to cursor pagination if a list ever grows past a few
/// thousand rows, since deep offsets force the database to count past every skipped
/// row — see docs/ARCHITECTURE.md.
/// </remarks>
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public const int DefaultPageSize = 25;
    public const int MaxPageSize = 100;

    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);

    public bool HasNextPage => Page < TotalPages;

    /// <summary>Clamps a caller-supplied page number to something sane.</summary>
    public static int NormalizePage(int page) => page < 1 ? 1 : page;

    /// <summary>
    /// Clamps a caller-supplied page size, so nobody can ask for the whole table in
    /// one request.
    /// </summary>
    public static int NormalizePageSize(int pageSize) =>
        pageSize < 1 ? DefaultPageSize : Math.Min(pageSize, MaxPageSize);
}
