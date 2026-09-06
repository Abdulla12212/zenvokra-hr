const STORAGE_KEY = 'cloudesh.continued';
const PERSONA_KEY = 'cloudesh.persona';

export type SessionPersona = 'employee' | 'admin';

/** Continue is a session stub — not authentication. */
export function hasContinuedSession(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function getSessionPersona(): SessionPersona {
  return sessionStorage.getItem(PERSONA_KEY) === 'admin' ? 'admin' : 'employee';
}

export function continueSession(persona: SessionPersona = 'employee'): void {
  sessionStorage.setItem(STORAGE_KEY, '1');
  sessionStorage.setItem(PERSONA_KEY, persona);
}

export function resetContinuedSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(PERSONA_KEY);
}
