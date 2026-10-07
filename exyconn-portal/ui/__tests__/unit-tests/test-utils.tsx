/**
 * The hub renders shell pages under the shell's own providers, so its tests use the shell's
 * render helper as-is: Apollo MockedProvider, i18n, theme, pickers, notifications, confirm,
 * a MemoryRouter and, with `user`, the real AuthProvider signed in from the stores.
 */
export {
  renderWithProviders,
  makeUser,
  makeSessionToken,
  seedSession,
  type ProviderOptions,
} from '../../../../packages/shell/__tests__/unit-tests/test-utils';
