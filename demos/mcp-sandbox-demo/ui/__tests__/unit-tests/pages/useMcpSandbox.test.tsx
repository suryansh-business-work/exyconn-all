import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMcpSandbox } from '../../../src/pages/mcp-sandbox/useMcpSandbox';
import { INFO, renderHookWithProviders, tokenOf } from '../test-utils';

const api = vi.hoisted(() => ({ info: vi.fn(), tokens: vi.fn(), issue: vi.fn(), revoke: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMcpSandboxInfoQuery: () => api.info(),
  useMcpSandboxTokensQuery: () => api.tokens(),
  useIssueMcpSandboxTokenMutation: () => [api.issue, { loading: false }],
  useRevokeMcpSandboxTokenMutation: () => [api.revoke],
}));

const refetchInfo = vi.fn();
const refetchTokens = vi.fn();
const issuedReply = (id: string, token: string) => ({
  data: { issueMcpSandboxToken: { token, sandboxToken: tokenOf({ id }) } },
});

beforeEach(() => {
  vi.clearAllMocks();
  api.info.mockReturnValue({ data: { mcpSandboxInfo: INFO }, refetch: refetchInfo });
  api.tokens.mockReturnValue({ data: { mcpSandboxTokens: [tokenOf()] }, refetch: refetchTokens });
});

describe('the sandbox data', () => {
  it('passes the sandbox and tokens through, and retries each', () => {
    const { result } = renderHookWithProviders(useMcpSandbox);
    expect(result.current.info).toEqual(INFO);
    expect(result.current.tokens).toHaveLength(1);
    result.current.retryInfo();
    result.current.retryTokens();
    expect(refetchInfo).toHaveBeenCalled();
    expect(refetchTokens).toHaveBeenCalled();
  });

  it('reports errors while nothing is loaded', () => {
    api.info.mockReturnValue({ error: new Error('Info failed'), refetch: refetchInfo });
    api.tokens.mockReturnValue({ error: new Error('Tokens failed'), refetch: refetchTokens });
    const { result } = renderHookWithProviders(useMcpSandbox);
    expect(result.current.info).toBeNull();
    expect(result.current.infoError).toBe('Info failed');
    expect(result.current.tokens).toEqual([]);
    expect(result.current.tokensError).toBe('Tokens failed');
  });

  it('takes a token and keeps its secret, or says why it could not', async () => {
    api.issue.mockResolvedValueOnce(issuedReply('tok-2', 'secret-2'));
    const { result } = renderHookWithProviders(useMcpSandbox);
    await act(() => result.current.issue());
    expect(result.current.issued).toEqual({
      token: 'secret-2',
      id: 'tok-2',
      expiresAt: tokenOf().expiresAt,
    });
    expect(await screen.findByText(/shown only once/)).toBeInTheDocument();
    api.issue.mockResolvedValueOnce({ data: undefined });
    await act(() => result.current.issue());
    expect(result.current.issued?.id).toBe('tok-2');
    api.issue.mockRejectedValueOnce(new Error('You have used today’s sandbox tokens.'));
    await act(() => result.current.issue());
    expect(await screen.findByText('You have used today’s sandbox tokens.')).toBeInTheDocument();
  });

  it('revokes a token, forgetting its secret only when it is the one shown', async () => {
    api.issue.mockResolvedValueOnce(issuedReply('tok-2', 'secret-2'));
    api.revoke.mockResolvedValue({});
    const { result } = renderHookWithProviders(useMcpSandbox);
    await act(() => result.current.issue());
    await act(() => result.current.revoke('tok-1'));
    expect(result.current.issued?.id).toBe('tok-2');
    expect(api.revoke).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'tok-1' } }),
    );
    await act(() => result.current.revoke('tok-2'));
    expect(result.current.issued).toBeNull();
    expect((await screen.findAllByText('The token was revoked')).length).toBeGreaterThan(0);
    api.revoke.mockRejectedValueOnce(new Error('Sandbox token not found'));
    await act(() => result.current.revoke('tok-9'));
    expect(await screen.findByText('Sandbox token not found')).toBeInTheDocument();
  });
});
