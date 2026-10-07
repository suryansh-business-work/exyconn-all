/**
 * `expo-constants`: a build pointed at a test portal (never contacted — stub `fetch`). To test
 * a build without an address, `vi.doMock('expo-constants', ...)` then re-import after
 * `vi.resetModules()`: tracker/config reads it once, at import.
 */
const Constants: { expoConfig: { extra?: Record<string, unknown> } | null } = {
  expoConfig: {
    extra: {
      portalGraphqlUrl: 'https://portal.example.test/graphql',
      portalWebUrl: 'https://portal.example.test',
    },
  },
};

export default Constants;
