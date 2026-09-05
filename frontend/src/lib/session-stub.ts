const STORAGE_KEY = 'cloudesh.continued';

/** Continue is a session stub — not authentication. */
export function hasContinuedSession(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function continueSession(): void {
  sessionStorage.setItem(STORAGE_KEY, '1');
}

export function resetContinuedSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
