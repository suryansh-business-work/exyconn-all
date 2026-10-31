import { useCallback, useState } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useIssueMcpSandboxTokenMutation,
  useMcpSandboxInfoQuery,
  useMcpSandboxTokensQuery,
  useRevokeMcpSandboxTokenMutation,
  type McpSandboxTokenFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

export type SandboxToken = McpSandboxTokenFieldsFragment;

/** The token the visitor took on this page: its secret is shown only here, only now. */
export interface IssuedToken {
  token: string;
  id: string;
  expiresAt: string;
}

const REFETCH = ['McpSandboxTokens', 'McpSandboxInfo'];

/**
 * The sandbox's data: the address, limits and sample records, the visitor's own tokens, and
 * taking or revoking one. A new token's secret stays in this page's memory only.
 */
export function useMcpSandbox() {
  const notify = useNotify();
  const info = useMcpSandboxInfoQuery({ fetchPolicy: 'cache-and-network' });
  const tokens = useMcpSandboxTokensQuery({ fetchPolicy: 'cache-and-network' });
  const [issueToken, { loading: issuing }] = useIssueMcpSandboxTokenMutation();
  const [revokeToken] = useRevokeMcpSandboxTokenMutation();
  const [issued, setIssued] = useState<IssuedToken | null>(null);

  const issue = useCallback(async () => {
    try {
      const { data } = await issueToken({ refetchQueries: REFETCH });
      const made = data?.issueMcpSandboxToken;
      if (made) {
        setIssued({
          token: made.token,
          id: made.sandboxToken.id,
          expiresAt: made.sandboxToken.expiresAt,
        });
        notify('Your sandbox token is ready. Copy it now: it is shown only once.', 'success');
      }
    } catch (error) {
      notify(errorMessage(error, 'The token could not be made. Try again.'), 'error');
    }
  }, [issueToken, notify]);

  const revoke = useCallback(
    async (id: string) => {
      try {
        await revokeToken({ variables: { id }, refetchQueries: REFETCH });
        setIssued((current) => (current?.id === id ? null : current));
        notify('The token was revoked', 'success');
      } catch (error) {
        notify(errorMessage(error, 'The token could not be revoked. Try again.'), 'error');
      }
    },
    [notify, revokeToken],
  );

  return {
    info: info.data?.mcpSandboxInfo ?? null,
    infoError: info.error?.message ?? null,
    retryInfo: () => info.refetch(),
    tokens: tokens.data?.mcpSandboxTokens ?? [],
    tokensError: tokens.error?.message ?? null,
    retryTokens: () => tokens.refetch(),
    issued,
    issuing,
    issue,
    revoke,
  };
}

export type McpSandbox = ReturnType<typeof useMcpSandbox>;
export type SandboxInfo = NonNullable<McpSandbox['info']>;
