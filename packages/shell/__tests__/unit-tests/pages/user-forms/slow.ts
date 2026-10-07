/**
 * These tests drive whole MUI forms through Apollo mocks. On a loaded machine (CI runs three
 * packages at once) a lookup can take seconds, so finds wait longer than the 1s default and
 * each test may run longer than the package's 20s.
 */
export const SLOW = { timeout: 10_000 };
export const FORM_TIMEOUT = 90_000;
