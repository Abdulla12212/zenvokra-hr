import { describe, expect, it } from 'vitest';

import { parseHomeSearch } from './home-search';

describe('parseHomeSearch', () => {
  const today = new Date(2026, 8, 13);

  it('uses today when the query string is empty', () => {
    const search = parseHomeSearch(new URLSearchParams(), today);

    expect(search).toEqual({
      year: 2026,
      month: 9,
      day: 13,
      sheet: null,
    });
  });

  it('does not treat a missing year as 0', () => {
    const search = parseHomeSearch(new URLSearchParams('month=9&day=13'), today);

    expect(search.year).toBe(2026);
    expect(search.month).toBe(9);
    expect(search.day).toBe(13);
  });

  it('ignores a zero year or month left by an old link', () => {
    const search = parseHomeSearch(new URLSearchParams('year=0&month=0&day=0'), today);

    expect(search).toEqual({
      year: 2026,
      month: 9,
      day: 13,
      sheet: null,
    });
  });

  it('treats the old empty-home link as today, not January', () => {
    const search = parseHomeSearch(new URLSearchParams('year=0&month=1&day=1'), today);

    expect(search).toEqual({
      year: 2026,
      month: 9,
      day: 13,
      sheet: null,
    });
  });
});
