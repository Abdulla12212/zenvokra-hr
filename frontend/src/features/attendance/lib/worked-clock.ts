import { useEffect, useRef, useState } from 'react';

export function formatWorkedClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return `${String(hours)}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function formatStampTime(iso: string | null): string {
  if (iso === null || iso === '') {
    return '—';
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function timerPriorSeconds(
  clockedIn: boolean,
  priorWorkedSeconds: number,
  recordedSeconds: number,
): number {
  if (clockedIn) {
    return Math.max(0, priorWorkedSeconds);
  }

  return Math.max(0, priorWorkedSeconds, recordedSeconds);
}

export function openSessionSeconds(openSinceAt: string | null, nowMs: number): number {
  if (openSinceAt === null || openSinceAt === '') {
    return 0;
  }

  const opened = new Date(openSinceAt).getTime();
  if (Number.isNaN(opened)) {
    return 0;
  }

  return Math.max(0, Math.floor((nowMs - opened) / 1000));
}

export interface WorkedClockState {
  todayIso: string;
  pausedSeconds: number;
  lastDisplaySeconds: number;
}

export interface WorkedClockInput {
  todayIso: string;
  priorWorkedSeconds: number;
  openSinceAt: string | null;
  nowMs: number;
}

export function nextWorkedClock(
  previous: WorkedClockState | null,
  input: WorkedClockInput,
): { state: WorkedClockState; displaySeconds: number } {
  const session = openSessionSeconds(input.openSinceAt, input.nowMs);
  const serverPrior = Math.max(0, Math.floor(input.priorWorkedSeconds));

  if (previous?.todayIso !== input.todayIso) {
    const displaySeconds = serverPrior + session;
    return {
      state: {
        todayIso: input.todayIso,
        pausedSeconds: serverPrior,
        lastDisplaySeconds: displaySeconds,
      },
      displaySeconds,
    };
  }

  const pausedSeconds = Math.max(previous.pausedSeconds, serverPrior);

  if (input.openSinceAt === null) {
    const banked = Math.max(pausedSeconds, previous.lastDisplaySeconds, serverPrior);
    return {
      state: {
        todayIso: input.todayIso,
        pausedSeconds: banked,
        lastDisplaySeconds: banked,
      },
      displaySeconds: banked,
    };
  }

  const displaySeconds = pausedSeconds + session;
  return {
    state: {
      todayIso: input.todayIso,
      pausedSeconds,
      lastDisplaySeconds: displaySeconds,
    },
    displaySeconds,
  };
}

export function useWorkedClock(
  todayIso: string,
  priorWorkedSeconds: number,
  openSinceAt: string | null,
): number {
  const stateRef = useRef<WorkedClockState | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState(() =>
    nextWorkedClock(null, {
      todayIso,
      priorWorkedSeconds,
      openSinceAt,
      nowMs: Date.now(),
    }).displaySeconds,
  );

  useEffect(() => {
    function tick() {
      const next = nextWorkedClock(stateRef.current, {
        todayIso,
        priorWorkedSeconds,
        openSinceAt,
        nowMs: Date.now(),
      });
      stateRef.current = next.state;
      setDisplaySeconds(next.displaySeconds);
    }

    tick();

    if (openSinceAt === null) {
      return;
    }

    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [todayIso, priorWorkedSeconds, openSinceAt]);

  return displaySeconds;
}
