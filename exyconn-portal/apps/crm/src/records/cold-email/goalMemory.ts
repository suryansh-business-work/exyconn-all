import { userStore } from '@exyconn/shell/auth/userStore';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/**
 * The last "what we are offering" each person typed, so the next draft starts from it. Kept in
 * this browser only (a convenience, not data); storage may be unavailable, which is fine.
 */
const keyOf = () => {
  try {
    return `crm.coldEmail.goal.${userStore.get()?.id ?? 'anonymous'}`;
  } catch {
    return 'crm.coldEmail.goal.anonymous';
  }
};

export function readGoal(): string {
  try {
    return globalThis.localStorage.getItem(keyOf()) ?? '';
  } catch (error) {
    portalLogger.warn('crm: reading the last cold email goal failed', error);
    return '';
  }
}

export function rememberGoal(goal: string): void {
  try {
    globalThis.localStorage.setItem(keyOf(), goal);
  } catch (error) {
    portalLogger.warn('crm: remembering the cold email goal failed', error);
  }
}
