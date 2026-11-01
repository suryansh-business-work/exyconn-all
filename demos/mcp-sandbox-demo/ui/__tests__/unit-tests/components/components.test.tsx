import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { CodeSnippet } from '../../../src/components/CodeSnippet';
import {
  ConnectSteps,
  claudeCodeCommand,
  claudeDesktopConfig,
} from '../../../src/components/ConnectSteps';
import { SampleData } from '../../../src/components/SampleData';
import { TokenPanel } from '../../../src/components/TokenPanel';
import { stateOf } from '../../../src/components/TokenList';
import { ENDPOINT, INFO, renderWithProviders, sandboxOf, tokenOf } from '../test-utils';

vi.mock('@exyconn/shell/utils/clipboard', () => ({ copyToClipboard: vi.fn() }));
const copy = vi.mocked(copyToClipboard);

afterEach(() => vi.clearAllMocks());

describe('a code snippet', () => {
  it('copies its text and says so, or says to copy it by hand', async () => {
    renderWithProviders(<CodeSnippet label="Claude Code command" code="claude mcp add" />);
    expect(screen.getByRole('region', { name: 'Claude Code command' })).toHaveTextContent(
      'claude mcp add',
    );
    copy.mockResolvedValueOnce(true);
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(copy).toHaveBeenCalledWith('claude mcp add');
    expect(await screen.findByText('Copied')).toBeInTheDocument();
    copy.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByText(/Could not copy/)).toBeInTheDocument();
  });
});

describe('connecting Claude', () => {
  it('builds the Claude Code command and the Claude Desktop config with the token', () => {
    expect(claudeCodeCommand(ENDPOINT, 'abc')).toBe(
      `claude mcp add --transport http exyconn-sandbox ${ENDPOINT} --header "Authorization: Bearer abc"`,
    );
    expect(JSON.parse(claudeDesktopConfig(ENDPOINT, 'abc'))).toEqual({
      mcpServers: {
        'exyconn-sandbox': {
          command: 'npx',
          args: ['-y', 'mcp-remote', ENDPOINT, '--header', 'Authorization: Bearer abc'],
        },
      },
    });
  });

  it('shows a placeholder until a token is taken, then the token itself', () => {
    const { rerender } = renderWithProviders(<ConnectSteps endpointUrl={ENDPOINT} token={null} />);
    expect(screen.getByRole('region', { name: 'Claude Code command' })).toHaveTextContent(
      '<your sandbox token>',
    );
    rerender(<ConnectSteps endpointUrl={ENDPOINT} token="secret-1" />);
    expect(screen.getByRole('region', { name: 'Claude Desktop config' })).toHaveTextContent(
      'Bearer secret-1',
    );
  });
});

describe('the sample data', () => {
  it('counts each kind of record', () => {
    renderWithProviders(<SampleData info={INFO} />);
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
  });
});

describe('the token panel', () => {
  it('shows loading, then a retryable error', async () => {
    const { unmount } = renderWithProviders(<TokenPanel sandbox={sandboxOf({ info: null })} />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    unmount();
    const sandbox = sandboxOf({ info: null, infoError: 'Network down' });
    renderWithProviders(<TokenPanel sandbox={sandbox} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(sandbox.retryInfo).toHaveBeenCalled();
  });

  it('describes the token’s window and modules, and takes one', async () => {
    const sandbox = sandboxOf();
    renderWithProviders(<TokenPanel sandbox={sandbox} />);
    expect(screen.getByText(/reads Exyconn MCP Sandbox for 60 minutes/)).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Get a read-only token' }));
    expect(sandbox.issue).toHaveBeenCalled();
  });

  it('stops at the daily limit', () => {
    renderWithProviders(
      <TokenPanel sandbox={sandboxOf({ info: { ...INFO, tokensLeftToday: 0 } })} />,
    );
    expect(screen.getByRole('button', { name: 'Get a read-only token' })).toBeDisabled();
    expect(screen.getByText(/used today’s sandbox tokens/)).toBeInTheDocument();
  });

  it('shows a new token once, and lists the tokens with Revoke on the live one', async () => {
    const live = tokenOf({ lastUsedAt: '2026-10-31T10:30:00.000Z' });
    const revoked = tokenOf({ id: 'tok-0', active: false, revokedAt: '2026-10-31T10:05:00.000Z' });
    const sandbox = sandboxOf({
      issued: { token: 'secret-1', id: live.id, expiresAt: live.expiresAt },
      tokens: [live, revoked],
    });
    renderWithProviders(<TokenPanel sandbox={sandbox} />);
    expect(screen.getByRole('region', { name: 'Your sandbox token' })).toHaveTextContent(
      'secret-1',
    );
    expect(screen.getByText(/shown only once/)).toBeInTheDocument();
    expect(screen.getByText(/Last used/)).toBeInTheDocument();
    expect(screen.getByText(/Not used yet/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Revoke' })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(sandbox.revoke).toHaveBeenCalledWith('tok-1');
  });

  it('offers a retry when the tokens cannot be read', async () => {
    const sandbox = sandboxOf({ tokensError: 'Server error' });
    renderWithProviders(<TokenPanel sandbox={sandbox} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(sandbox.retryTokens).toHaveBeenCalled();
  });

  it('names why a token does or does not work', () => {
    expect(stateOf(tokenOf())).toBe('ACTIVE');
    expect(stateOf(tokenOf({ active: false, revokedAt: '2026-10-31T10:05:00.000Z' }))).toBe(
      'REVOKED',
    );
    expect(stateOf(tokenOf({ active: false }))).toBe('EXPIRED');
  });
});
