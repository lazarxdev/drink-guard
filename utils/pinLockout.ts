const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

let failedAttempts = 0;
let lockoutUntil: number | null = null;

export function recordFailedAttempt(): { locked: boolean; remainingSeconds: number; attempts: number } {
  failedAttempts++;

  if (failedAttempts >= MAX_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    return {
      locked: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      attempts: failedAttempts,
    };
  }

  return { locked: false, remainingSeconds: 0, attempts: failedAttempts };
}

export function isLockedOut(): { locked: boolean; remainingSeconds: number } {
  if (!lockoutUntil) return { locked: false, remainingSeconds: 0 };

  const remaining = lockoutUntil - Date.now();
  if (remaining <= 0) {
    // Lockout expired — reset
    lockoutUntil = null;
    failedAttempts = 0;
    return { locked: false, remainingSeconds: 0 };
  }

  return { locked: true, remainingSeconds: Math.ceil(remaining / 1000) };
}

export function resetLockout(): void {
  failedAttempts = 0;
  lockoutUntil = null;
}

export function getFailedAttempts(): number {
  return failedAttempts;
}
