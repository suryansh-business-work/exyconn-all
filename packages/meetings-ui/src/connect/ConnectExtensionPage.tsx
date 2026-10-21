import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useMaAuthorizeExtensionMutation } from '@exyconn/shell/graphql/generated';
import { ConsentCard } from './ConsentCard';
import { deniedRedirect, readConnectRequest } from './connect-params';

/**
 * The extension's sign-in consent screen (`/me/meetings/connect-extension`). The extension
 * opens it with a PKCE request; Allow issues a one-time code and sends the browser back to
 * the extension, Cancel sends it back with `error=access_denied`.
 */
export function ConnectExtensionPage({ homePath }: Readonly<{ homePath: string }>) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authorize, { loading }] = useMaAuthorizeExtensionMutation();
  const [failure, setFailure] = useState<string | null>(null);
  const request = readConnectRequest(params);

  if (!request) {
    return (
      <EmptyState
        title="This sign-in link is incomplete"
        description="Open the Meeting Assistant extension and choose Sign in again."
      />
    );
  }

  const allow = async () => {
    setFailure(null);
    try {
      const result = await authorize({ variables: { input: request } });
      const redirect = result.data?.maAuthorizeExtension;
      if (redirect) {
        globalThis.location.assign(redirect);
      }
    } catch (error) {
      setFailure(errorMessage(error, 'The extension could not be signed in.'));
    }
  };
  const cancel = () => {
    const back = deniedRedirect(request.redirectUri, request.state);
    if (back) {
      globalThis.location.assign(back);
    } else {
      navigate(homePath);
    }
  };

  return (
    <ConsentCard
      email={user?.email ?? ''}
      submitting={loading}
      failure={failure}
      onAllow={allow}
      onCancel={cancel}
    />
  );
}
