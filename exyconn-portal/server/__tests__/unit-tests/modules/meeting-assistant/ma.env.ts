/** The Chrome extension id the suites sign in with. */
export const EXTENSION_ID = 'abcdefghijklmnopabcdefghijklmnop';

/**
 * The real env with EXTENSION_ID trusted. The extension ids are read from the environment once,
 * when env.ts loads, so a suite swaps the module: `jest.mock(<env path>, () =>
 * jest.requireActual('./ma.env').envTrustingExtension())`.
 */
export function envTrustingExtension() {
  const actual = jest.requireActual('../../../../src/config/env');
  return {
    ...actual,
    env: {
      ...actual.env,
      meetAssistant: { ...actual.env.meetAssistant, extensionIds: [EXTENSION_ID] },
    },
  };
}
