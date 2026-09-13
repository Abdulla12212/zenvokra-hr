import { describe, expect, it } from 'vitest';

import {
  formatWorkedClock,
  nextWorkedClock,
  openSessionSeconds,
  timerPriorSeconds,
} from './worked-clock';

describe('formatWorkedClock', () => {
  it('formats hours, minutes, and seconds', () => {
    expect(formatWorkedClock(0)).toBe('0h 00m 00s');
    expect(formatWorkedClock(75)).toBe('0h 01m 15s');
    expect(formatWorkedClock(3661)).toBe('1h 01m 01s');
  });
});

describe('nextWorkedClock', () => {
  const todayIso = '2026-09-13';
  const opened = '2026-09-13T10:00:00.000Z';
  const start = Date.parse(opened);

  it('ticks from prior + the open session', () => {
    const first = nextWorkedClock(null, {
      todayIso,
      priorWorkedSeconds: 0,
      openSinceAt: opened,
      nowMs: start,
    });
    expect(first.displaySeconds).toBe(0);

    const later = nextWorkedClock(first.state, {
      todayIso,
      priorWorkedSeconds: 0,
      openSinceAt: opened,
      nowMs: start + 45_000,
    });
    expect(later.displaySeconds).toBe(45);
  });

  it('keeps the last shown total when clock-out reports zero', () => {
    const running = nextWorkedClock(null, {
      todayIso,
      priorWorkedSeconds: 0,
      openSinceAt: opened,
      nowMs: start + 90_000,
    });
    expect(running.displaySeconds).toBe(90);

    const paused = nextWorkedClock(running.state, {
      todayIso,
      priorWorkedSeconds: 0,
      openSinceAt: null,
      nowMs: start + 91_000,
    });
    expect(paused.displaySeconds).toBe(90);

    const resumed = nextWorkedClock(paused.state, {
      todayIso,
      priorWorkedSeconds: 0,
      openSinceAt: '2026-09-13T12:00:00.000Z',
      nowMs: Date.parse('2026-09-13T12:00:10.000Z'),
    });
    expect(resumed.displaySeconds).toBe(100);
  });

  it('resumes from the server prior when it is larger', () => {
    const paused = nextWorkedClock(null, {
      todayIso,
      priorWorkedSeconds: 120,
      openSinceAt: null,
      nowMs: start,
    });

    const resumed = nextWorkedClock(paused.state, {
      todayIso,
      priorWorkedSeconds: 120,
      openSinceAt: opened,
      nowMs: start + 15_000,
    });
    expect(resumed.displaySeconds).toBe(135);
  });
});

describe('timerPriorSeconds', () => {
  it('uses recorded seconds when a closed day reports prior 0', () => {
    expect(timerPriorSeconds(false, 0, 4500)).toBe(4500);
    expect(timerPriorSeconds(true, 0, 4500)).toBe(0);
  });
});

describe('openSessionSeconds', () => {
  it('is zero when the session is closed', () => {
    expect(openSessionSeconds(null, Date.now())).toBe(0);
  });
});
