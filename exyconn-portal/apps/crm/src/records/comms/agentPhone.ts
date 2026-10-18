import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/** The CRM user's own phone for click-to-call, remembered per browser. */
const STORAGE_KEY = 'exyconn.crm.agent-phone';

/** The saved number, or blank when nothing was saved or storage is blocked. */
export function readAgentPhone(): string {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch (error) {
    portalLogger.warn('crm: could not read the saved phone', error);
    return '';
  }
}

export function saveAgentPhone(phone: string): void {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, phone);
  } catch (error) {
    portalLogger.warn('crm: could not remember the phone', error);
  }
}
