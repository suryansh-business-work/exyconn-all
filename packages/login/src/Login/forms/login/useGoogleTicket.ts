import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useCompleteGoogleSignInMutation,
  type SignInResultFragment,
} from '@exyconn/shell/graphql/generated';

const TICKET = 'googleTicket';
const ERROR = 'googleError';
export const GOOGLE_PARAMS = [TICKET, ERROR] as const;

/**
 * The return leg of "Continue with Google": the callback adds either a one-time ticket or a
 * reason it did not work to this page's address. Both are taken off the address at once, and a
 * ticket is redeemed exactly once (it would fail a second time).
 */
export function useGoogleTicket(
  onResult: (result: SignInResultFragment) => void,
  onError: (message: string) => void,
) {
  const [params, setParams] = useSearchParams();
  const [complete] = useCompleteGoogleSignInMutation();
  const handled = useRef(false);
  const ticket = params.get(TICKET);
  const problem = params.get(ERROR);

  useEffect(() => {
    if (handled.current || (ticket === null && problem === null)) {
      return;
    }
    handled.current = true;
    const rest = new URLSearchParams(params);
    GOOGLE_PARAMS.forEach((param) => rest.delete(param));
    setParams(rest, { replace: true });
    if (problem !== null) {
      onError(problem);
      return;
    }
    complete({ variables: { ticket: ticket ?? '' } })
      .then(({ data }) => {
        if (data) {
          onResult(data.completeGoogleSignIn);
        }
      })
      .catch((err: unknown) => {
        onError(err instanceof Error ? err.message : 'Google sign-in failed');
      });
  }, [ticket, problem, params, setParams, complete, onResult, onError]);
}
