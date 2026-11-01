import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderResult } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { I18nProvider } from '@exyconn/i18n';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import type {
  McpSandbox,
  SandboxInfo,
  SandboxToken,
} from '../../src/pages/mcp-sandbox/useMcpSandbox';

/** What the shell's PortalApp puts above the demo page: Apollo, i18n, theme and toasts. */
function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <MockedProvider mocks={[]} showWarnings={false}>
      <I18nProvider locale="en" messages={{}}>
        <ColorModeProvider>
          <NotificationProvider>
            <MemoryRouter>{children}</MemoryRouter>
          </NotificationProvider>
        </ColorModeProvider>
      </I18nProvider>
    </MockedProvider>
  );
}

export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(ui, { wrapper: Providers });
}

export function renderHookWithProviders<Result>(hook: () => Result) {
  return renderHook(hook, { wrapper: Providers });
}

export const ENDPOINT = 'https://portal-server.exyconn.com/mcp/all';

/** The sandbox as the server describes it. */
export const INFO: SandboxInfo = {
  __typename: 'McpSandboxInfo',
  organizationName: 'Exyconn MCP Sandbox',
  serverName: 'Exyconn All',
  endpointUrl: ENDPOINT,
  tokenTtlMinutes: 60,
  tokensPerDay: 5,
  tokensLeftToday: 4,
  callsPerHour: 120,
  modules: ['CRM', 'Projects'],
  sample: [
    { __typename: 'McpSandboxSample', label: 'Companies', count: 6 },
    { __typename: 'McpSandboxSample', label: 'Deals', count: 1200 },
  ],
};

/** A token as the server lists it; live unless overridden. */
export function tokenOf(overrides: Partial<SandboxToken> = {}): SandboxToken {
  return {
    __typename: 'McpSandboxToken',
    id: 'tok-1',
    expiresAt: '2026-10-31T11:00:00.000Z',
    createdAt: '2026-10-31T10:00:00.000Z',
    revokedAt: null,
    lastUsedAt: null,
    active: true,
    ...overrides,
  };
}

/** The page's data, ready with no tokens unless overridden. */
export function sandboxOf(overrides: Partial<McpSandbox> = {}): McpSandbox {
  return {
    info: INFO,
    infoError: null,
    retryInfo: vi.fn(),
    tokens: [],
    tokensError: null,
    retryTokens: vi.fn(),
    issued: null,
    issuing: false,
    issue: vi.fn(),
    revoke: vi.fn(),
    ...overrides,
  } as McpSandbox;
}

/** A fetch answer as the MCP endpoint sends it. */
export function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) };
}
