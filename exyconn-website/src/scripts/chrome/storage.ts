/**
 * localStorage that never throws: a private window, blocked site data or a full quota make
 * the preference last for this page only, and the reason is logged.
 */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Preference "${key}" could not be read`, error);
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Preference "${key}" could not be saved`, error);
  }
}
